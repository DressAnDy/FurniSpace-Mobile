import { useCallback, useEffect, useRef } from "react";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeNotificationHub } from "../../../core/realtime/notificationHub";
import { queryKeys } from "../../../shared/constants/queryKeys";
import { useAuthStore } from "../../auth/store/auth.store";
import { shouldRefreshProjectTracking } from "../../project/utils/project.tracking.realtime";
import { refetchSaleProjectOverviewQueries } from "./useSaleCommercial";

type UseSaleOrderDetailRealtimeOptions = {
  orderId: string | null;
  projectId: string | null;
  enabled?: boolean;
};

async function refetchSaleOrderDetailQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  orderId: string,
  projectId: string | null,
): Promise<void> {
  await Promise.all([
    queryClient.refetchQueries({ queryKey: queryKeys.order.detail(orderId) }),
    queryClient.refetchQueries({ queryKey: ["sale", "order", orderId, "payments"] }),
    queryClient.refetchQueries({ queryKey: queryKeys.sale.deliveries(orderId) }),
    queryClient.refetchQueries({ queryKey: queryKeys.sale.deliveryTracking(orderId) }),
    projectId
      ? queryClient.refetchQueries({ queryKey: queryKeys.sale.productionRequests({ projectId, orderId }) })
      : Promise.resolve(),
    projectId ? queryClient.refetchQueries({ queryKey: queryKeys.project.phaseDeadlines(projectId) }) : Promise.resolve(),
    projectId ? refetchSaleProjectOverviewQueries(queryClient, projectId) : Promise.resolve(),
  ]);
}

export function useSaleOrderDetailRealtime({
  orderId,
  projectId,
  enabled = true,
}: UseSaleOrderDetailRealtimeOptions): void {
  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isFocused = useIsFocused();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!enabled || !isLoggedIn || !orderId) {
        return;
      }

      void refetchSaleOrderDetailQueries(queryClient, orderId, projectId);
    }, [enabled, isLoggedIn, orderId, projectId, queryClient]),
  );

  useEffect(() => {
    if (!enabled || !isLoggedIn || !isFocused || !orderId || !projectId) {
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
        void refetchSaleOrderDetailQueries(queryClient, orderId, projectId);
      }, 350);
    });

    return () => {
      unsubscribe();
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [enabled, isFocused, isLoggedIn, orderId, projectId, queryClient]);
}
