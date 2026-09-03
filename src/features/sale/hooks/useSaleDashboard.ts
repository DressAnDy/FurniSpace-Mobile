import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/constants/queryKeys";
import { useAuthStore } from "../../auth/store/auth.store";
import { ProjectDetailDto, ProjectListQuery, ProjectStatus } from "../../project/models/project.model";
import { getProjectsApi } from "../../project/services/project.api";
import { normalizeProjectDetailDto } from "../../project/utils/project.mapper";
import {
  AssignDesignerRequestDto,
  assignProjectDesignerApi,
  claimSalesAssignmentApi,
  getAvailableDesignersApi,
  getDashboardProjectPhaseDeadlinesApi,
  getSalesActionQueueApi,
  getSalesKpisApi,
  requestProjectInformationApi,
} from "../services/sale.api";
import {
  DashboardPhaseDeadlinesQuery,
  ClaimSalesAssignmentRequestDto,
  RequestProjectInformationDto,
  SalesActionQueueQuery,
  SalesKpisQuery,
} from "../models/sale.model";
import { mapProjectToSaleProjectCard, mapProjectToSaleRequestCard } from "../utils/sale.mapper";

export function useSalesKpisQuery(query: SalesKpisQuery = {}) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.sale.kpis(query),
    enabled: isLoggedIn,
    queryFn: () => getSalesKpisApi(query),
  });
}

export function useSalesActionQueueQuery(query: SalesActionQueueQuery = {}) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.sale.actionQueue(query),
    enabled: isLoggedIn,
    queryFn: () => getSalesActionQueueApi(query),
  });
}

export function useDashboardPhaseDeadlinesQuery(query: DashboardPhaseDeadlinesQuery = {}) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.sale.dashboardPhaseDeadlines(query),
    enabled: isLoggedIn,
    queryFn: () => getDashboardProjectPhaseDeadlinesApi(query),
  });
}

const INTAKE_STATUSES: ProjectStatus[] = ["SUBMITTED", "IN_CONSULTATION", "NEED_BASIC_INFORMATION"];

export function useSaleInboxProjectsQuery(options: {
  filter: "All" | "New" | "In Review" | "Waiting Info";
  search?: string;
  page?: number;
  limit?: number;
}) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const status = requestFilterToStatus(options.filter);
  const page = options.page ?? 1;
  const limit = options.limit ?? 5;

  return useQuery({
    queryKey: queryKeys.project.list({
      status: status ?? "ALL_INTAKE",
      search: options.search,
      page,
      limit,
    }),
    enabled: isLoggedIn,
    queryFn: async () => {
      // "All" must merge intake statuses — a bare list page mixes non-inbox work and truncates.
      if (!status) {
        const responses = await Promise.all(
          INTAKE_STATUSES.map((intakeStatus) =>
            getProjectsApi({
              status: intakeStatus,
              ...(options.search ? { search: options.search } : {}),
              page: 1,
              limit: 100,
            }),
          ),
        );

        const seen = new Set<string>();
        const merged = responses
          .flatMap((response) => response.items)
          .filter((item) => {
            if (seen.has(item.projectId)) {
              return false;
            }
            seen.add(item.projectId);
            return matchesSaleRequestFilter(item.status, "All");
          })
          .sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime())
          .map(mapProjectToSaleRequestCard);

        const start = (page - 1) * limit;
        return {
          items: merged.slice(start, start + limit),
          page,
          limit,
          total: merged.length,
        };
      }

      const response = await getProjectsApi({
        status,
        ...(options.search ? { search: options.search } : {}),
        page,
        limit,
      });

      const items = response.items
        .filter((item) => matchesSaleRequestFilter(item.status, options.filter))
        .map(mapProjectToSaleRequestCard);

      return {
        ...response,
        items,
        total: response.total,
      };
    },
  });
}

function requestFilterToStatus(
  filter: "All" | "New" | "In Review" | "Waiting Info",
): ProjectStatus | undefined {
  if (filter === "New") {
    return "SUBMITTED";
  }
  if (filter === "In Review") {
    return "IN_CONSULTATION";
  }
  if (filter === "Waiting Info") {
    return "NEED_BASIC_INFORMATION";
  }
  return undefined;
}

export function useSaleAssignedProjectsQuery(query: Omit<ProjectListQuery, "assignedSalesId"> = {}) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const accountId = useAuthStore((state) => state.user?.accountId);

  return useQuery({
    queryKey: queryKeys.project.list({ ...query, assignedSalesId: accountId }),
    enabled: isLoggedIn && Boolean(accountId),
    queryFn: async () => {
      const response = await getProjectsApi({
        ...query,
        assignedSalesId: accountId!,
        page: query.page ?? 1,
        limit: query.limit ?? 5,
      });
      return {
        ...response,
        items: response.items.map(mapProjectToSaleProjectCard),
      };
    },
  });
}

export function saleProjectsFilterToStatus(
  filter: "All" | "Active" | "Production" | "Delivery",
): ProjectStatus | undefined {
  if (filter === "Production") {
    return "IN_PRODUCTION";
  }
  if (filter === "Delivery") {
    return "DELIVERING";
  }
  return undefined;
}

export function useClaimSalesAssignmentMutation() {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: ({ projectId, note }: { projectId: string; note?: string } & ClaimSalesAssignmentRequestDto) =>
      claimSalesAssignmentApi(projectId, note ? { note } : { note: "Taking this lead" }),
    onSuccess: (response) => {
      queryClient.setQueryData<ProjectDetailDto>(queryKeys.project.detail(response.projectId), (current) => {
        if (!current) {
          return current;
        }

        return normalizeProjectDetailDto({
          ...current,
          assignedSalesId: response.assignedSalesId,
          assignedSales:
            authUser && authUser.accountId === response.assignedSalesId
              ? { accountId: authUser.accountId, fullName: authUser.fullName }
              : current.assignedSales,
          status: (response.status as ProjectStatus) ?? current.status,
        });
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(response.projectId) });
      void queryClient.invalidateQueries({ queryKey: ["project", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["sale"] });
    },
  });
}

export function useRequestProjectInformationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, message }: { projectId: string } & RequestProjectInformationDto) =>
      requestProjectInformationApi(projectId, { message }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["project", "list"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(variables.projectId) });
      void queryClient.invalidateQueries({ queryKey: ["sale"] });
    },
  });
}

export function useAvailableDesignersQuery(enabled = true) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: ["sale", "available-designers"] as const,
    enabled: isLoggedIn && enabled,
    queryFn: () => getAvailableDesignersApi(),
  });
}

export function useAssignProjectDesignerMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AssignDesignerRequestDto) => assignProjectDesignerApi(projectId!, payload),
    onSuccess: (response) => {
      if (projectId) {
        queryClient.setQueryData<ProjectDetailDto>(queryKeys.project.detail(projectId), (current) => {
          if (!current) {
            return current;
          }

          const assignedDesignerId =
            response.assignedDesigner?.accountId ?? response.assignedDesignerId ?? current.assignedDesignerId;

          return normalizeProjectDetailDto({
            ...current,
            assignedDesignerId,
            assignedDesigner: response.assignedDesigner ?? current.assignedDesigner,
            status: (response.status as ProjectStatus) ?? current.status,
          });
        });
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.phaseDeadlines(projectId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.payment.projectStartFeeStatus(projectId) });
        void queryClient.invalidateQueries({ queryKey: ["project", "list"] });
        void queryClient.invalidateQueries({ queryKey: ["sale"] });
      }
    },
  });
}

export function matchesSaleProjectFilter(
  status: ProjectStatus,
  filter: "All" | "Active" | "Production" | "Delivery",
): boolean {
  if (filter === "All") {
    return true;
  }
  if (filter === "Active") {
    return status !== "COMPLETED" && status !== "REJECTED";
  }
  if (filter === "Production") {
    return status === "IN_PRODUCTION" || status === "READY_FOR_DELIVERY";
  }
  return status === "DELIVERING" || status === "DELIVERED";
}

export function matchesSaleRequestFilter(
  status: ProjectStatus,
  filter: "All" | "New" | "In Review" | "Waiting Info",
): boolean {
  if (filter === "All") {
    return (
      status === "SUBMITTED" ||
      status === "IN_CONSULTATION" ||
      status === "NEED_BASIC_INFORMATION"
    );
  }
  if (filter === "New") {
    return status === "SUBMITTED";
  }
  if (filter === "In Review") {
    return status === "IN_CONSULTATION";
  }
  return status === "NEED_BASIC_INFORMATION";
}
