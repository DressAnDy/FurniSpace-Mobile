import React, { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { ensureNotificationPermissions, showLocalNotification } from "../../core/notifications/localNotifications";
import {
  connectNotificationHub,
  disconnectNotificationHub,
  getNotificationHubState,
  restartNotificationHub,
  subscribeNotificationHub,
} from "../../core/realtime/notificationHub";
import {
  disconnectPaymentHub,
  hasJoinedPayments,
  restartPaymentHub,
} from "../../core/realtime/paymentHub";
import {
  disconnectProjectChatHub,
  hasJoinedProjectChats,
  restartProjectChatHub,
} from "../../core/realtime/projectChatHub";
import {
  eventStartsWith,
  isChatRealtimeEvent,
  normalizeRealtimeEventKey,
} from "../../core/realtime/notificationEvents";
import { useAuthStore } from "../../features/auth/store/auth.store";
import { prefetchNotificationQueries } from "../../features/notification/hooks/useNotifications";
import { getUnreadNotificationCountApi } from "../../features/notification/services/notification.api";
import { RealtimeNotificationPayloadDto } from "../../features/notification/models/notification.model";
import { resolveNotificationCategory } from "../../features/notification/utils/notification.mapper";
import { queryKeys } from "../../shared/constants/queryKeys";
import { subscribeAuthTokenRefresh } from "../../core/api/interceptors";
import {
  isProjectRequestSubmittedEvent,
  invalidateSaleLeadInboxQueries,
} from "../../features/sale/utils/sale.lead.realtime";
import {
  invalidateProductIssueQueries,
  isProductIssueNotification,
} from "../../features/project/utils/productIssue.realtime";
import { invalidateDashboardQueries } from "../../shared/utils/dashboardCache";
import { HubConnectionState } from "@microsoft/signalr";

/** Backup poll when hub may be zombie — keep light for customer UX. */
const UNREAD_CATCHUP_INTERVAL_MS = 60_000;

function invalidateDomainQueriesForEvent(
  queryClient: ReturnType<typeof useQueryClient>,
  eventKey: string,
  payload: RealtimeNotificationPayloadDto,
): void {
  if (isProjectRequestSubmittedEvent({ ...payload, eventKey })) {
    invalidateSaleLeadInboxQueries(queryClient);
  }

  if (isProductIssueNotification({ ...payload, notificationType: eventKey })) {
    invalidateProductIssueQueries(queryClient, {
      notificationType: eventKey,
      referenceType: payload.referenceType,
      referenceId: payload.referenceId,
      projectId: payload.projectId,
      metadata: payload.metadata,
    });
  }

  const isChatOnly = isChatRealtimeEvent(eventKey, payload.referenceType);
  // Sale/Designer dashboards only — skip work for customer sessions.
  const role = useAuthStore.getState().user?.role;
  if (!isChatOnly && role && role !== "CUSTOMER") {
    invalidateDashboardQueries(queryClient);
  }

  if (isChatOnly && payload.projectId) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.chat.projectList(payload.projectId) });
  }

  if (eventStartsWith(eventKey, "project.", "proposal.")) {
    void queryClient.invalidateQueries({ queryKey: ["project", "list"] });
    void queryClient.invalidateQueries({ queryKey: ["project", "by-user"] });
    if (payload.projectId) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(payload.projectId) });
      void queryClient.invalidateQueries({ queryKey: ["project", "proposals", payload.projectId] });
    } else {
      void queryClient.invalidateQueries({ queryKey: ["project", "detail"] });
      void queryClient.invalidateQueries({ queryKey: ["project", "proposals"] });
    }
  }

  if (eventStartsWith(eventKey, "quotation.")) {
    void queryClient.invalidateQueries({ queryKey: ["project", "quotations"] });
    void queryClient.invalidateQueries({ queryKey: ["project", "list"] });
    if (payload.projectId) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(payload.projectId) });
    }
  }

  if (eventStartsWith(eventKey, "payment.")) {
    void queryClient.invalidateQueries({ queryKey: ["payment", "list"] });
    void queryClient.invalidateQueries({ queryKey: ["payment", "summary"] });
    if (payload.referenceId) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payment.detail(payload.referenceId) });
    }
    if (payload.projectId) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.payment.projectStartFeeStatus(payload.projectId),
      });
    }
  }

  if (eventStartsWith(eventKey, "order.", "delivery.", "production.", "production_item.")) {
    void queryClient.invalidateQueries({ queryKey: ["project", "orders"] });
    void queryClient.invalidateQueries({ queryKey: ["project", "tracking-orders"] });
    void queryClient.invalidateQueries({ queryKey: ["order"] });
    void queryClient.invalidateQueries({ queryKey: ["sale", "deliveries"] });
    void queryClient.invalidateQueries({ queryKey: ["sale", "delivery-tracking"] });
    void queryClient.invalidateQueries({ queryKey: ["sale", "production-requests"] });
  }

  if (eventStartsWith(eventKey, "project_schedule.", "measurement_image.")) {
    void queryClient.invalidateQueries({ queryKey: ["project", "schedules"] });
    void queryClient.invalidateQueries({ queryKey: ["project-schedule"] });
  }

  if (eventStartsWith(eventKey, "customization.", "customization_request.")) {
    void queryClient.invalidateQueries({ queryKey: ["customization"] });
  }

  if (eventStartsWith(eventKey, "product_issue.")) {
    void queryClient.invalidateQueries({ queryKey: ["product-issue"] });
  }
}

async function catchUpFromUnreadCount(
  queryClient: ReturnType<typeof useQueryClient>,
  previousUnreadRef: { current: number | null },
  options?: { domainInvalidate?: boolean },
): Promise<void> {
  try {
    const result = await getUnreadNotificationCountApi();
    const nextCount = result.unreadCount ?? 0;
    const previous = previousUnreadRef.current;
    previousUnreadRef.current = nextCount;

    void queryClient.invalidateQueries({ queryKey: queryKeys.notification.unreadCount });

    if (previous == null || nextCount <= previous) {
      return;
    }

    // Unread increased while hub may have been zombie — refresh bell + focused domains only.
    void queryClient.invalidateQueries({ queryKey: ["notification", "list"] });
    if (options?.domainInvalidate === false) {
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["project", "list"], type: "active" });
    void queryClient.invalidateQueries({ queryKey: ["payment", "list"], type: "active" });
    void queryClient.invalidateQueries({ queryKey: ["order"], type: "active" });
  } catch {
    // Catch-up is best-effort.
  }
}

export function NotificationRealtimeBridge(): null {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const queryClient = useQueryClient();
  const previousUnreadRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      void disconnectNotificationHub();
      void disconnectPaymentHub();
      void disconnectProjectChatHub();
      previousUnreadRef.current = null;
      return;
    }

    // Let login navigation + Home first paint finish before hub/prefetch work.
    const schedulePostLoginWork = () => {
      void ensureNotificationPermissions().catch(() => undefined);
      prefetchNotificationQueries(queryClient);
      // Payment hub connects on-demand from payment screens (JoinPayment).
      void connectNotificationHub().catch(() => undefined);
      // Prefetch already seeds unread — avoid a second /unread call on login.
    };

    const idleWindow = globalThis as typeof globalThis & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    let idleHandle: number | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    if (typeof idleWindow.requestIdleCallback === "function") {
      idleHandle = idleWindow.requestIdleCallback(schedulePostLoginWork, { timeout: 1200 });
    } else {
      timeoutHandle = setTimeout(schedulePostLoginWork, 0);
    }

    const unsubscribe = subscribeNotificationHub((payload, eventName) => {
      const eventKey = normalizeRealtimeEventKey(eventName, payload.notificationType);
      const category = resolveNotificationCategory(payload.notificationType, payload.referenceType);

      // Persist=Yes (has notificationId) → local alert + bell invalidate.
      if (payload.notificationId) {
        void showLocalNotification({
          title: payload.title,
          body: payload.message,
          data: {
            notificationId: payload.notificationId,
            category,
            referenceType: payload.referenceType,
            referenceId: payload.referenceId,
            projectId: payload.projectId,
            eventName: eventKey,
          },
        });

        void queryClient.invalidateQueries({ queryKey: queryKeys.notification.unreadCount });
        void queryClient.invalidateQueries({ queryKey: ["notification", "list"] });
      }

      invalidateDomainQueriesForEvent(queryClient, eventKey, payload);
    });

    const catchUpTimer = setInterval(() => {
      // Skip heavy catch-up while notification hub looks healthy.
      const hubState = getNotificationHubState();
      if (hubState === HubConnectionState.Connected) {
        void catchUpFromUnreadCount(queryClient, previousUnreadRef, { domainInvalidate: false });
        return;
      }
      void catchUpFromUnreadCount(queryClient, previousUnreadRef);
    }, UNREAD_CATCHUP_INTERVAL_MS);

    return () => {
      if (idleHandle != null && typeof idleWindow.cancelIdleCallback === "function") {
        idleWindow.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      unsubscribe();
      clearInterval(catchUpTimer);
    };
  }, [isLoggedIn, queryClient]);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    return subscribeAuthTokenRefresh(() => {
      void restartNotificationHub();
      if (hasJoinedPayments()) {
        void restartPaymentHub();
      }
      if (hasJoinedProjectChats()) {
        void restartProjectChatHub();
      }
    });
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    let previousState = AppState.currentState;
    const subscription = AppState.addEventListener("change", (nextState) => {
      const becameActive = previousState !== "active" && nextState === "active";
      previousState = nextState;
      if (!becameActive) {
        return;
      }

      const restarts: Array<Promise<unknown>> = [restartNotificationHub()];
      if (hasJoinedPayments()) {
        restarts.push(restartPaymentHub());
      }
      if (hasJoinedProjectChats()) {
        restarts.push(restartProjectChatHub());
      }

      void Promise.all(restarts).finally(() => {
        void catchUpFromUnreadCount(queryClient, previousUnreadRef, { domainInvalidate: false });
        void queryClient.invalidateQueries({ queryKey: queryKeys.notification.unreadCount });
        void queryClient.invalidateQueries({ queryKey: ["notification", "list"], type: "active" });
        if (hasJoinedPayments()) {
          void queryClient.invalidateQueries({ queryKey: ["payment"], type: "active" });
        }
        if (hasJoinedProjectChats()) {
          void queryClient.invalidateQueries({ queryKey: ["chat"], type: "active" });
        }
      });
    });

    return () => subscription.remove();
  }, [isLoggedIn, queryClient]);

  return null;
}
