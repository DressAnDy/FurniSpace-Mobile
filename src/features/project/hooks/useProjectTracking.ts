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
  getScheduleStartAt,
  isDepositEligibleOrderStatus,
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
  // Project detail is required; secondary endpoints failing should not block the whole screen.
  const isError = Boolean(projectQuery.isError);
  const error = projectQuery.error ?? null;

  const data = useMemo<ProjectTrackingData | null>(() => {
    if (!projectQuery.data) {
      return null;
    }

    const embeddedDeadlines = projectQuery.data.phaseDeadlines ?? [];
    const phaseDeadlines: PhaseDeadlinesResponseDto = phaseDeadlinesQuery.data ?? {
      projectId: projectId ?? projectQuery.data.projectId,
      targetCompletionDate: projectQuery.data.targetCompletionDate,
      deadlines: embeddedDeadlines.map((item) => ({
        phase: item.phase,
        dueDate: item.dueDate,
        startedAt: item.startedAt ?? null,
        completedAt: item.completedAt,
        status: item.status,
        overdueDays: item.overdueDays,
      })),
    };

    return {
      project: projectQuery.data,
      phaseDeadlines,
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
        void refetchProjectTrackingQueries(queryClient, projectId);
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
        void refetchProjectTrackingQueries(queryClient, projectId);
      }
    },
  });
}

export function canReopenProposal(status: ProjectStatus, order?: OrderDto | null): boolean {
  if (status === "PROPOSAL_SELECTED" || status === "QUOTATION_SENT") {
    return true;
  }

  if (status !== "ORDER_CONFIRMED") {
    return false;
  }

  // Source statuses before deposit paid / production created.
  if (!order) {
    return true;
  }

  return isDepositEligibleOrderStatus(order.status);
}

export function canPayDeposit(projectStatus: ProjectStatus, order: OrderDto | null, paidDeposit: boolean): boolean {
  if (paidDeposit || !order) {
    return false;
  }

  return projectStatus === "ORDER_CONFIRMED" && isDepositEligibleOrderStatus(order.status);
}

export function canConfirmDelivery(
  projectStatus: ProjectStatus,
  order: OrderDto | null,
  remainingQuantity?: number | null,
): boolean {
  if (!order) {
    return false;
  }

  if (order.status === "AWAITING_CUSTOMER_CONFIRMATION") {
    return true;
  }

  if (projectStatus === "DELIVERING" && remainingQuantity === 0) {
    return true;
  }

  return false;
}

export function getPendingConfirmationSchedules(schedules: ProjectScheduleDto[]): ProjectScheduleDto[] {
  return schedules.filter((schedule) => schedule.status === "PENDING_CONFIRMATION");
}

export function getUpcomingSchedules(schedules: ProjectScheduleDto[]): ProjectScheduleDto[] {
  const now = Date.now();
  return schedules
    .filter((schedule) => schedule.status !== "CANCELLED" && schedule.status !== "COMPLETED")
    .filter((schedule) => {
      const startAt = getScheduleStartAt(schedule);
      if (!startAt) {
        return true;
      }
      const time = new Date(startAt).getTime();
      return Number.isNaN(time) || time >= now - 24 * 60 * 60 * 1000;
    })
    .sort((left, right) => {
      const leftTime = new Date(getScheduleStartAt(left)).getTime() || 0;
      const rightTime = new Date(getScheduleStartAt(right)).getTime() || 0;
      return leftTime - rightTime;
    })
    .slice(0, 5);
}

export function getPrimaryOrder(orders: OrderDto[]): OrderDto | null {
  if (orders.length === 0) {
    return null;
  }

  const active = orders.find((order) => order.status !== "CANCELLED");
  const pool = active ? orders.filter((order) => order.status !== "CANCELLED") : orders;

  return [...pool].sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  })[0];
}
