import React, { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectNotificationHub, disconnectNotificationHub, subscribeNotificationHub } from "../../core/realtime/notificationHub";
import { useAuthStore } from "../../features/auth/store/auth.store";
import { RealtimeNotificationPayloadDto } from "../../features/notification/models/notification.model";
import { queryKeys } from "../../shared/constants/queryKeys";

export function NotificationRealtimeBridge(): null {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoggedIn) {
      void disconnectNotificationHub();
      return;
    }

    void connectNotificationHub().catch(() => undefined);

    const unsubscribe = subscribeNotificationHub((payload: RealtimeNotificationPayloadDto) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notification.unreadCount });
      if (payload.notificationId) {
        void queryClient.invalidateQueries({ queryKey: ["notification", "list"] });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isLoggedIn, queryClient]);

  return null;
}
