import { useCallback, useEffect, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  connectNotificationHub,
  subscribeNotificationHub,
} from "../../../core/realtime/notificationHub";
import { useAuthStore } from "../../auth/store/auth.store";
import { shouldRefreshProjectTracking } from "../utils/project.tracking.realtime";

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
  const refetchAllRef = useRef(refetchAll);
  const hasFocusedRef = useRef(false);

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
      void refetchAllRef.current();

      return () => {
        hasFocusedRef.current = false;
      };
    }, [enabled, isLoggedIn, projectId]),
  );

  useEffect(() => {
    if (!enabled || !projectId || !isLoggedIn) {
      return;
    }

    void connectNotificationHub().catch(() => undefined);

    const unsubscribe = subscribeNotificationHub((payload) => {
      if (!shouldRefreshProjectTracking(payload, projectId)) {
        return;
      }

      void refetchAllRef.current();
    });

    return unsubscribe;
  }, [enabled, isLoggedIn, projectId]);
}
