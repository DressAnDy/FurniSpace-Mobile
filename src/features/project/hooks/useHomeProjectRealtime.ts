import { useCallback, useEffect, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  connectNotificationHub,
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
  const refetchProjectsRef = useRef(refetchProjects);
  const hasFocusedRef = useRef(false);

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
      void refetchProjectsRef.current();

      return () => {
        hasFocusedRef.current = false;
      };
    }, [enabled, isLoggedIn]),
  );

  useEffect(() => {
    if (!enabled || !isLoggedIn) {
      return;
    }

    void connectNotificationHub().catch(() => undefined);

    const unsubscribe = subscribeNotificationHub((payload) => {
      if (projectId) {
        if (!shouldRefreshProjectTracking(payload, projectId)) {
          return;
        }
      } else if (!payload.notificationType.startsWith("project.")) {
        return;
      }

      void refetchProjectsRef.current();
    });

    return unsubscribe;
  }, [enabled, isLoggedIn, projectId]);
}
