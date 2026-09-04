import React, { useEffect } from "react";
import { AppState } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { ensureNotificationPermissions, showLocalNotification } from "../../core/notifications/localNotifications";
import {
  connectNotificationHub,
  disconnectNotificationHub,
  restartNotificationHub,
  subscribeNotificationHub,
} from "../../core/realtime/notificationHub";
import { restartPaymentHub } from "../../core/realtime/paymentHub";
import { restartProjectChatHub } from "../../core/realtime/projectChatHub";
import { useAuthStore } from "../../features/auth/store/auth.store";
import { prefetchNotificationQueries } from "../../features/notification/hooks/useNotifications";
import { RealtimeNotificationPayloadDto } from "../../features/notification/models/notification.model";
import { resolveNotificationCategory } from "../../features/notification/utils/notification.mapper";
import { queryKeys } from "../../shared/constants/queryKeys";
import { subscribeAuthTokenRefresh } from "../../core/api/interceptors";
import { isProjectRequestSubmittedEvent, invalidateSaleLeadInboxQueries } from "../../features/sale/utils/sale.lead.realtime";

export function NotificationRealtimeBridge(): null {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoggedIn) {
      void disconnectNotificationHub();
      return;
    }

    void ensureNotificationPermissions().catch(() => undefined);
    prefetchNotificationQueries(queryClient);
    void connectNotificationHub().catch(() => undefined);

    const unsubscribe = subscribeNotificationHub((payload: RealtimeNotificationPayloadDto) => {
      const category = resolveNotificationCategory(payload.notificationType, payload.referenceType);

      void showLocalNotification({
        title: payload.title,
        body: payload.message,
        data: {
          notificationId: payload.notificationId,
          category,
          referenceType: payload.referenceType,
          referenceId: payload.referenceId,
          projectId: payload.projectId,
        },
      });

      void queryClient.invalidateQueries({ queryKey: queryKeys.notification.unreadCount });
      if (payload.notificationId) {
        void queryClient.invalidateQueries({ queryKey: ["notification", "list"] });
      }

      if (isProjectRequestSubmittedEvent(payload)) {
        invalidateSaleLeadInboxQueries(queryClient);
      }

      if (
        payload.projectId &&
        (payload.referenceType === "PROJECT_CHAT_MESSAGE" ||
          payload.notificationType === "project_chat.message_sent")
      ) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.chat.projectList(payload.projectId) });
      }

      if (payload.notificationType.startsWith("payment.")) {
        void queryClient.invalidateQueries({ queryKey: ["payment", "list"] });
        if (payload.referenceId) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.payment.detail(payload.referenceId) });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isLoggedIn, queryClient]);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    return subscribeAuthTokenRefresh(() => {
      void restartNotificationHub();
      void restartPaymentHub();
      void restartProjectChatHub();
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

      void Promise.all([
        restartNotificationHub(),
        restartPaymentHub(),
        restartProjectChatHub(),
      ]).finally(() => {
        void queryClient.invalidateQueries({ queryKey: ["notification"] });
        void queryClient.invalidateQueries({ queryKey: ["payment"], type: "active" });
        void queryClient.invalidateQueries({ queryKey: ["chat"], type: "active" });
        // Sales lead inbox has no claim-broadcast SignalR — refresh SUBMITTED lists on resume.
        void queryClient.invalidateQueries({ queryKey: ["project", "list"], type: "active" });
      });
    });

    return () => subscription.remove();
  }, [isLoggedIn, queryClient]);

  return null;
}
