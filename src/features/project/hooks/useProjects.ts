import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/constants/queryKeys";
import { env } from "../../../core/config/env";
import { useAuthStore } from "../../auth/store/auth.store";
import { ProjectListQuery } from "../models/project.model";
import { getProjectByIdApi, getProjectsApi } from "../services/project.api";
import { useProjectStore } from "../store/project.store";
import { mapProjectListItemToSummary, pickDefaultActiveProject } from "../utils/project.mapper";

export function useProjectsQuery(query: ProjectListQuery = {}) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.project.list(query),
    enabled: isLoggedIn,
    queryFn: async () => {
      const response = await getProjectsApi(query);
      return {
        ...response,
        items: response.items.map(mapProjectListItemToSummary),
      };
    },
  });
}

export function useProjectDetailQuery(projectId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.project.detail(projectId ?? "none"),
    enabled: isLoggedIn && Boolean(projectId),
    queryFn: () => getProjectByIdApi(projectId!),
  });
}

export function useDefaultActiveProjectSync() {
  const projectsQuery = useProjectsQuery({ limit: 100 });
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const setActiveProjectId = useProjectStore((state) => state.setActiveProjectId);

  const defaultProject = useMemo(
    () => pickDefaultActiveProject(projectsQuery.data?.items ?? []),
    [projectsQuery.data?.items],
  );

  useEffect(() => {
    if (!defaultProject || activeProjectId) {
      return;
    }

    if (env.activeProjectId) {
      const envProjectExists = projectsQuery.data?.items.some((project) => project.projectId === env.activeProjectId);
      if (envProjectExists) {
        setActiveProjectId(env.activeProjectId);
        return;
      }
    }

    setActiveProjectId(defaultProject.projectId);
  }, [activeProjectId, defaultProject, projectsQuery.data?.items, setActiveProjectId]);

  useEffect(() => {
    if (!activeProjectId || !projectsQuery.data?.items.length) {
      return;
    }

    const stillExists = projectsQuery.data.items.some((project) => project.projectId === activeProjectId);
    if (!stillExists && defaultProject) {
      setActiveProjectId(defaultProject.projectId);
    }
  }, [activeProjectId, defaultProject, projectsQuery.data?.items, setActiveProjectId]);

  return {
    projectsQuery,
    defaultProject,
  };
}

export function useActiveProjectSummary() {
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const { projectsQuery } = useDefaultActiveProjectSync();

  const activeProject = useMemo(() => {
    const items = projectsQuery.data?.items ?? [];
    if (activeProjectId) {
      return items.find((project) => project.projectId === activeProjectId) ?? null;
    }

    return pickDefaultActiveProject(items);
  }, [activeProjectId, projectsQuery.data?.items]);

  return {
    activeProject,
    activeProjectId,
    projectsQuery,
  };
}
