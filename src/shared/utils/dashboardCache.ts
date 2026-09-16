import type { QueryClient } from "@tanstack/react-query";

export function invalidateDashboardQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ["sale", "kpis"] });
  void queryClient.invalidateQueries({ queryKey: ["sale", "kpi-list"] });
  void queryClient.invalidateQueries({ queryKey: ["sale", "action-queue"] });
  void queryClient.invalidateQueries({ queryKey: ["designer", "kpis"] });
  void queryClient.invalidateQueries({ queryKey: ["designer", "kpi-list"] });
  void queryClient.invalidateQueries({ queryKey: ["designer", "work-queue"] });
}

export function clearSessionQueryCache(queryClient: QueryClient): void {
  queryClient.clear();
}
