import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { ProjectSummaryItem } from "../models/project.model";
import { prefetchProjectTrackingQueries } from "./useProjectTracking";

export function useProjectSwitcherPrefetch(_projects: ProjectSummaryItem[]) {
  const queryClient = useQueryClient();
  const prefetchProject = useCallback(
    (projectId: string) => {
      void prefetchProjectTrackingQueries(queryClient, projectId);
    },
    [queryClient],
  );

  const prefetchAllProjects = useCallback(() => {
    // Rows prefetch individually via onPressIn; avoid N × 5 request bursts.
  }, []);

  return {
    prefetchProject,
    prefetchAllProjects,
  };
}
