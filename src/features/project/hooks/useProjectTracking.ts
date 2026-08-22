import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { queryKeys } from "../../../shared/constants/queryKeys";
import { useAuthStore } from "../../auth/store/auth.store";
import { getPaymentsApi } from "../../payment/services/payment.api";
import { ProjectStatus } from "../models/project.model";
import { OrderDto, PhaseDeadlinesResponseDto, ProjectScheduleDto } from "../models/project.tracking.model";
import { getProjectByIdApi, reopenProjectProposalApi } from "../services/project.api";
import {
  confirmOrderDeliveryApi,
  confirmProjectScheduleApi,
  getProjectOrdersApi,
  getProjectPhaseDeadlinesApi,
  getProjectSchedulesApi,
} from "../services/project.tracking.api";
import { buildProjectTrackingSummary } from "../utils/project.tracking.mapper";

export type ProjectTrackingData = {
  project: Awaited<ReturnType<typeof getProjectByIdApi>>;
  phaseDeadlines: PhaseDeadlinesResponseDto;
  schedules: ProjectScheduleDto[];
  orders: OrderDto[];
  payments: Awaited<ReturnType<typeof getPaymentsApi>>;
  tracking: ReturnType<typeof buildProjectTrackingSummary>;
};

const TRACKING_STALE_MS = 30_000;

function buildTrackingQueryOptions(projectId: string, isLoggedIn: boolean) {
  const enabled = isLoggedIn && Boolean(projectId);

  return [
    {
      queryKey: queryKeys.project.detail(projectId),
      enabled,
      staleTime: TRACKING_STALE_MS,
      retry: 1,
      refetchOnWindowFocus: false,
      queryFn: () => getProjectByIdApi(projectId),
    },
    {
      queryKey: queryKeys.project.phaseDeadlines(projectId),
      enabled,
      staleTime: TRACKING_STALE_MS,
      retry: false,
      refetchOnWindowFocus: false,
      queryFn: () => getProjectPhaseDeadlinesApi(projectId),
    },
    {
      queryKey: queryKeys.project.schedules(projectId),
      enabled,
      staleTime: TRACKING_STALE_MS,
      retry: false,
      refetchOnWindowFocus: false,
      queryFn: () => getProjectSchedulesApi(projectId),
    },
    {
      queryKey: queryKeys.project.orders(projectId),
      enabled,
      staleTime: TRACKING_STALE_MS,
      retry: false,
      refetchOnWindowFocus: false,
      queryFn: () => getProjectOrdersApi(projectId),
    },
    {
      queryKey: queryKeys.payment.list({ projectId, limit: 20 }),
      enabled,
      staleTime: TRACKING_STALE_MS,
      retry: false,
      refetchOnWindowFocus: false,
      queryFn: () => getPaymentsApi({ projectId, limit: 20 }),
    },
  ] as const;
}

export function refetchProjectTrackingQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
): Promise<void> {
  return Promise.all([
    queryClient.refetchQueries({ queryKey: queryKeys.project.detail(projectId), type: "active" }),
    queryClient.refetchQueries({ queryKey: queryKeys.project.phaseDeadlines(projectId), type: "active" }),
    queryClient.refetchQueries({ queryKey: queryKeys.project.schedules(projectId), type: "active" }),
    queryClient.refetchQueries({ queryKey: queryKeys.project.orders(projectId), type: "active" }),
    queryClient.refetchQueries({
      queryKey: queryKeys.payment.list({ projectId }),
      type: "active",
    }),
    queryClient.invalidateQueries({ queryKey: ["project", "list"] }),
    queryClient.invalidateQueries({ queryKey: ["project", "by-user"] }),
  ]).then(() => undefined);
}

export function invalidateProjectTrackingQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
): void {
  void refetchProjectTrackingQueries(queryClient, projectId);
}

export function useProjectTrackingQueries(projectId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const queryClient = useQueryClient();
  const enabled = isLoggedIn && Boolean(projectId);
  const resolvedProjectId = projectId ?? "none";

  const results = useQueries({
    queries: buildTrackingQueryOptions(resolvedProjectId, enabled && projectId !== null),
  });

  const [projectQuery, phaseDeadlinesQuery, schedulesQuery, ordersQuery, paymentsQuery] = results;

  const isLoading = enabled && results.some((query) => query.isLoading);
  const isRefetching = enabled && results.some((query) => query.isFetching && !query.isLoading);
  const isError = results.some((query) => query.isError);
  const error = results.find((query) => query.error)?.error ?? null;

  const data = useMemo<ProjectTrackingData | null>(() => {
    if (!projectQuery.data) {
      return null;
    }

    return {
      project: projectQuery.data,
      phaseDeadlines: phaseDeadlinesQuery.data ?? {
        projectId: projectId ?? "",
        targetCompletionDate: projectQuery.data.targetCompletionDate,
        deadlines: [],
      },
      schedules: schedulesQuery.data ?? [],
      orders: ordersQuery.data ?? [],
      payments: paymentsQuery.data ?? { items: [], page: 1, limit: 20, total: 0 },
      tracking: buildProjectTrackingSummary(projectQuery.data.status),
    };
  }, [ordersQuery.data, paymentsQuery.data, phaseDeadlinesQuery.data, projectId, projectQuery.data, schedulesQuery.data]);

  const refetchAll = useCallback(async () => {
    if (!projectId) {
      return;
    }

    await refetchProjectTrackingQueries(queryClient, projectId);
  }, [projectId, queryClient]);

  return {
    data,
    isLoading,
    isRefetching,
    isError,
    error,
    refetchAll,
    projectQuery,
    phaseDeadlinesQuery,
    schedulesQuery,
    ordersQuery,
    paymentsQuery,
  };
}

export function useConfirmProjectScheduleMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scheduleId: string) => confirmProjectScheduleApi(scheduleId),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.schedules(projectId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
      }
    },
  });
}

export function useConfirmOrderDeliveryMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => confirmOrderDeliveryApi(orderId),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.orders(projectId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
      }
    },
  });
}

export function useReopenProjectProposalMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => reopenProjectProposalApi(projectId!),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.list({}) });
      }
    },
  });
}

export function canReopenProposal(status: ProjectStatus): boolean {
  return status === "PROPOSAL_SELECTED" || status === "QUOTATION_SENT" || status === "ORDER_CONFIRMED";
}

export function getPendingConfirmationSchedules(schedules: ProjectScheduleDto[]): ProjectScheduleDto[] {
  return schedules.filter((schedule) => schedule.status === "PENDING_CONFIRMATION");
}

export function getUpcomingSchedules(schedules: ProjectScheduleDto[]): ProjectScheduleDto[] {
  const now = Date.now();
  return schedules
    .filter((schedule) => schedule.status !== "CANCELLED" && schedule.status !== "COMPLETED")
    .filter((schedule) => new Date(schedule.scheduledAt).getTime() >= now - 24 * 60 * 60 * 1000)
    .sort((left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime())
    .slice(0, 5);
}

export function getPrimaryOrder(orders: OrderDto[]): OrderDto | null {
  if (orders.length === 0) {
    return null;
  }

  return [...orders].sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  })[0];
}
