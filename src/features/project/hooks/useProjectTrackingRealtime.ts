import { useCallback, useEffect, useRef } from "react";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import {
  subscribeNotificationHub,
} from "../../../core/realtime/notificationHub";
import { useAuthStore } from "../../auth/store/auth.store";
import { shouldRefreshProjectTracking } from "../utils/project.tracking.realtime";
import { queryKeys } from "../../../shared/constants/queryKeys";

type UseProjectTrackingRealtimeOptions = {
  projectId: string | null;
  enabled?: boolean;
  refetchAll: () => Promise<unknown>;
};

export function useProjectTrackingRealtime({
  projectId,
  enabled = true,
  refetchAll,
}: UseProjectTrackingRealtimeOptions): void {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isFocused = useIsFocused();
  const queryClient = useQueryClient();
  const refetchAllRef = useRef(refetchAll);
  const hasFocusedRef = useRef(false);
  const lastRefreshAtRef = useRef(Date.now());
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  refetchAllRef.current = refetchAll;

  useFocusEffect(
    useCallback(() => {
      if (!enabled || !projectId || !isLoggedIn) {
        return;
      }

      if (hasFocusedRef.current) {
        return;
      }

      hasFocusedRef.current = true;
      if (Date.now() - lastRefreshAtRef.current >= 30_000) {
        lastRefreshAtRef.current = Date.now();
        void refetchAllRef.current();
      }

      return () => {
        hasFocusedRef.current = false;
      };
    }, [enabled, isLoggedIn, projectId]),
  );

  useEffect(() => {
    if (!enabled || !projectId || !isLoggedIn || !isFocused) {
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
        lastRefreshAtRef.current = Date.now();
        const type = payload.notificationType;
        if (type.startsWith("project_schedule.")) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.project.schedules(projectId) });
        } else if (type.startsWith("payment.")) {
          void queryClient.invalidateQueries({ queryKey: ["payment", "list"] });
          void queryClient.invalidateQueries({ queryKey: queryKeys.project.trackingOrders(projectId) });
        } else if (type.startsWith("order.")) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.project.trackingOrders(projectId) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.project.orders(projectId) });
        } else if (type.startsWith("proposal.")) {
          void queryClient.invalidateQueries({ queryKey: ["project", "proposals", projectId] });
        } else if (type.startsWith("quotation.")) {
          void queryClient.invalidateQueries({ queryKey: ["project", "quotations", projectId] });
        }
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
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
