import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/constants/queryKeys";
import { useAuthStore } from "../../auth/store/auth.store";
import {
  CreateDeliveryDelayReportInput,
  CreateProductionDelayReportInput,
  OperationalDelayPhase,
} from "../models/operationalDelay.model";
import {
  createDeliveryDelayReportApi,
  createProductionDelayReportApi,
  getOperationalDelayReportApi,
  getProjectOperationalDelayReportsApi,
} from "../services/operationalDelay.api";

export function useProjectOperationalDelayReportsQuery(
  projectId: string | null,
  phase: OperationalDelayPhase,
  enabled = true,
) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.delayReport.byProject(projectId ?? "none", phase),
    enabled: isLoggedIn && enabled && Boolean(projectId),
    queryFn: () => getProjectOperationalDelayReportsApi(projectId!, phase),
  });
}

export function useOperationalDelayReportQuery(reportId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.delayReport.detail(reportId ?? "none"),
    enabled: isLoggedIn && Boolean(reportId),
    queryFn: () => getOperationalDelayReportApi(reportId!),
  });
}

export function useCreateProductionDelayReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductionDelayReportInput) => createProductionDelayReportApi(input),
    onSuccess: (report, input) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.delayReport.byProject(input.projectId, "PRODUCTION"),
      });
      queryClient.setQueryData(queryKeys.delayReport.detail(report.operationalDelayReportId), report);
    },
  });
}

export function useCreateDeliveryDelayReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDeliveryDelayReportInput) => createDeliveryDelayReportApi(input),
    onSuccess: (report, input) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.delayReport.byProject(input.projectId, "DELIVERY"),
      });
      queryClient.setQueryData(queryKeys.delayReport.detail(report.operationalDelayReportId), report);
    },
  });
}

export function formatDelayLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
