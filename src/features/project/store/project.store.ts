import { create } from "zustand";

type ProjectState = {
  activeProjectId: string | null;
  setActiveProjectId: (projectId: string | null) => void;
};

export const useProjectStore = create<ProjectState>((set) => ({
  activeProjectId: null,
  setActiveProjectId: (projectId) => set({ activeProjectId: projectId }),
}));

export function useActiveProjectId(routeProjectId?: string): string | null {
  const storedProjectId = useProjectStore((state) => state.activeProjectId);
  return routeProjectId ?? storedProjectId;
}
