import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { ProjectSummaryItem } from "../models/project.model";
import { prefetchProjectDetailQuery, prefetchProjectTrackingQueries } from "./useProjectTracking";

export function useProjectSwitcherPrefetch(projects: ProjectSummaryItem[]) {
  const queryClient = useQueryClient();
  const prefetchedProjectIdsRef = useRef(new Set<string>());

  useEffect(() => {
    if (projects.length === 0) {
      return;
    }

    for (const project of projects) {
      if (prefetchedProjectIdsRef.current.has(project.projectId)) {
        continue;
      }

      prefetchedProjectIdsRef.current.add(project.projectId);
      void prefetchProjectDetailQuery(queryClient, project.projectId);
    }
  }, [projects, queryClient]);

  const prefetchProject = useCallback(
    (projectId: string) => {
      void prefetchProjectTrackingQueries(queryClient, projectId);
    },
    [queryClient],
  );

  const prefetchAllProjects = useCallback(() => {
    for (const project of projects) {
      void prefetchProjectTrackingQueries(queryClient, project.projectId);
    }
  }, [projects, queryClient]);

  return {
    prefetchProject,
    prefetchAllProjects,
  };
}
