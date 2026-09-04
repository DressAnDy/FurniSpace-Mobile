import { useCallback, useEffect, useRef } from "react";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeNotificationHub } from "../../../core/realtime/notificationHub";
import { useAuthStore } from "../../auth/store/auth.store";
import { shouldRefreshProjectTracking } from "../../project/utils/project.tracking.realtime";
import { refetchSaleProjectOverviewQueries } from "./useSaleCommercial";

type UseSaleProjectOverviewRealtimeOptions = {
  projectId: string | null;
  enabled?: boolean;
};

export function useSaleProjectOverviewRealtime({
  projectId,
  enabled = true,
}: UseSaleProjectOverviewRealtimeOptions): void {
  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isFocused = useIsFocused();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!enabled || !isLoggedIn || !projectId) {
        return;
      }

      void refetchSaleProjectOverviewQueries(queryClient, projectId);
    }, [enabled, isLoggedIn, projectId, queryClient]),
  );

  useEffect(() => {
    if (!enabled || !isLoggedIn || !isFocused || !projectId) {
      return;
    }

    const unsubscribe = subscribeNotificationHub((payload) => {
      if (!shouldRefreshProjectTracking(payload, projectId)) {
        return;
      }

      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = setTimeout(() => {
        void refetchSaleProjectOverviewQueries(queryClient, projectId);
      }, 350);
    });

    return () => {
      unsubscribe();
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [enabled, isFocused, isLoggedIn, projectId, queryClient]);
}
