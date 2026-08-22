import { useCallback, useEffect, useRef } from "react";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import {
  subscribeNotificationHub,
} from "../../../core/realtime/notificationHub";
import { useAuthStore } from "../../auth/store/auth.store";
import { shouldRefreshProjectTracking } from "../utils/project.tracking.realtime";

type UseHomeProjectRealtimeOptions = {
  projectId: string | null;
  enabled?: boolean;
  refetchProjects: () => Promise<unknown>;
};

export function useHomeProjectRealtime({
  projectId,
  enabled = true,
  refetchProjects,
}: UseHomeProjectRealtimeOptions): void {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isFocused = useIsFocused();
  const refetchProjectsRef = useRef(refetchProjects);
  const hasFocusedRef = useRef(false);
  const lastRefreshAtRef = useRef(Date.now());
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  refetchProjectsRef.current = refetchProjects;

  useFocusEffect(
    useCallback(() => {
      if (!enabled || !isLoggedIn) {
        return;
      }

      if (hasFocusedRef.current) {
        return;
      }

      hasFocusedRef.current = true;
      if (Date.now() - lastRefreshAtRef.current >= 30_000) {
        lastRefreshAtRef.current = Date.now();
        void refetchProjectsRef.current();
      }

      return () => {
        hasFocusedRef.current = false;
      };
    }, [enabled, isLoggedIn]),
  );

  useEffect(() => {
    if (!enabled || !isLoggedIn || !isFocused) {
      return;
    }

    const unsubscribe = subscribeNotificationHub((payload) => {
      if (projectId) {
        if (!shouldRefreshProjectTracking(payload, projectId)) {
          return;
        }
      } else if (!payload.notificationType.startsWith("project.")) {
        return;
      }

      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      refreshTimerRef.current = setTimeout(() => {
        lastRefreshAtRef.current = Date.now();
        void refetchProjectsRef.current();
      }, 350);
    });

    return () => {
      unsubscribe();
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [enabled, isFocused, isLoggedIn, projectId]);
}
