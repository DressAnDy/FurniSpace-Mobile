import React, { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ensureNotificationPermissions, showLocalNotification } from "../../core/notifications/localNotifications";
import { connectNotificationHub, disconnectNotificationHub, subscribeNotificationHub } from "../../core/realtime/notificationHub";
import { useAuthStore } from "../../features/auth/store/auth.store";
import { RealtimeNotificationPayloadDto } from "../../features/notification/models/notification.model";
import { resolveNotificationCategory } from "../../features/notification/utils/notification.mapper";
import { queryKeys } from "../../shared/constants/queryKeys";

export function NotificationRealtimeBridge(): null {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoggedIn) {
      void disconnectNotificationHub();
      return;
    }

    void ensureNotificationPermissions().catch(() => undefined);
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

      if (payload.referenceType === "PROJECT_CHAT_MESSAGE" && payload.projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.chat.projectList(payload.projectId) });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isLoggedIn, queryClient]);

  return null;
}
