import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/constants/queryKeys";
import { useAuthStore } from "../../auth/store/auth.store";
import { compareProjectsByStatusFlow, getProjectStatusLabel } from "../../project/utils/project.mapper";
import { getProjectsApi } from "../../project/services/project.api";
import type { ProjectStatus } from "../../project/models/project.model";
import {
  CreateProposalRequestDto,
  CreateProposalSceneRequestDto,
  DesignerCatalogProductsQuery,
  DesignerKpisDto,
  DesignerKpisQuery,
  DesignerWorkQueueQuery,
  PublishProposalRequestDto,
  UpdateProposalRequestDto,
  UploadMeasurementImageInput,
} from "../models/designer.model";
import {
  createProposalApi,
  createProposalSceneApi,
  getDesignerCatalogProductApi,
  getDesignerCatalogProductsApi,
  getDesignerKpisApi,
  getDesignerWorkQueueApi,
  getProposalDetailForDesignerApi,
  publishProposalApi,
  reopenProposalApi,
  updateProposalApi,
  uploadScheduleMeasurementImageApi,
} from "../services/designer.api";
import { getProjectProposalsApi } from "../../project/services/proposal.api";
import {
  getMyAssignedSchedulesApi,
  getProjectAreasApi,
  getProjectMeasurementImagesApi,
  getScheduleMeasurementImagesApi,
  updateProjectScheduleStatusApi,
} from "../../sale/services/sale.ops.api";
import { getProjectSchedulesApi } from "../../project/services/project.tracking.api";
import type { UpdateProjectScheduleStatusRequestDto } from "../../project/models/project.tracking.model";
import { ProjectMeasurementImagesQuery } from "../../sale/models/sale.ops.model";

export function useDesignerKpisQuery(query: DesignerKpisQuery = {}) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.designer.kpis(query),
    enabled: isLoggedIn,
    queryFn: () => getDesignerKpisApi(query),
  });
}

export function useDesignerWorkQueueQuery(query: DesignerWorkQueueQuery = {}) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.designer.workQueue(query),
    enabled: isLoggedIn,
    queryFn: () => getDesignerWorkQueueApi(query),
  });
}

export type DesignerProjectListFilter = "All" | "Active" | "Measurement" | "Proposal" | ProjectStatus;

export function useDesignerAssignedProjectsQuery(
  options: {
    filter?: DesignerProjectListFilter;
    search?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const accountId = useAuthStore((state) => state.user?.accountId);
  const filter = options.filter ?? "All";
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const search = options.search?.trim() || undefined;

  return useQuery({
    queryKey: queryKeys.project.list({
      assignedDesignerId: accountId,
      filter,
      search,
      page,
      limit,
    }),
    enabled: isLoggedIn && Boolean(accountId),
    queryFn: async () => {
      const response = await getProjectsApi({
        assignedDesignerId: accountId!,
        ...(search ? { search } : {}),
        page: 1,
        limit: 100,
      });

      const filtered = response.items.filter((item) => matchesDesignerProjectFilter(item.status, filter));
      const sorted = [...filtered].sort(compareProjectsByStatusFlow);
      const start = (page - 1) * limit;

      return {
        items: sorted.slice(start, start + limit).map((item) => ({
          projectId: item.projectId,
          projectCode: item.projectCode,
          name: item.projectName,
          customer: "Customer",
          type: item.businessType ?? "—",
          status: getProjectStatusLabel(item.status),
          statusCode: item.status,
          target: "—",
          color: "#2F5D50",
        })),
        page,
        limit,
        total: sorted.length,
      };
    },
  });
}

function matchesDesignerProjectFilter(status: ProjectStatus, filter: DesignerProjectListFilter): boolean {
  if (filter === "All") {
    return true;
  }
  if (filter === "Active") {
    return ![
      "COMPLETED",
      "REJECTED",
      "SUBMITTED",
      "IN_CONSULTATION",
      "NEED_BASIC_INFORMATION",
      "WAITING_FOR_DESIGNER_ASSIGNMENT",
    ].includes(status);
  }
  if (filter === "Measurement") {
    return status === "MEASUREMENT_REQUIRED" || status === "SPACE_VERIFIED";
  }
  if (filter === "Proposal") {
    return status === "PROPOSAL_CONSULTING" || status === "PROPOSAL_SELECTED";
  }
  return status === filter;
}

export function useDesignerCatalogProductsQuery(
  projectId: string | null,
  query: DesignerCatalogProductsQuery = {},
  enabled = true,
) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.designer.catalogProducts(projectId ?? "none", query),
    enabled: isLoggedIn && enabled && Boolean(projectId),
    queryFn: () => getDesignerCatalogProductsApi(projectId!, query),
  });
}

export function useDesignerCatalogProductQuery(projectId: string | null, productId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.designer.catalogProduct(projectId ?? "none", productId ?? "none"),
    enabled: isLoggedIn && Boolean(projectId) && Boolean(productId),
    queryFn: () => getDesignerCatalogProductApi(projectId!, productId!),
  });
}

export function useDesignerProjectProposalsQuery(projectId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.sale.proposals(projectId ?? "none"),
    enabled: isLoggedIn && Boolean(projectId),
    queryFn: () => getProjectProposalsApi(projectId!, { page: 1, limit: 50 }),
  });
}

export function useDesignerProposalDetailQuery(proposalId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.proposal.detail(proposalId ?? "none"),
    enabled: isLoggedIn && Boolean(proposalId),
    queryFn: () => getProposalDetailForDesignerApi(proposalId!),
  });
}

export function useCreateProposalMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProposalRequestDto) => createProposalApi(projectId!, payload),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.proposals(projectId) });
      }
    },
  });
}

export function useUpdateProposalMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, ...payload }: UpdateProposalRequestDto & { proposalId: string }) =>
      updateProposalApi(proposalId, payload),
    onSuccess: (proposal) => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.proposals(projectId) });
      }
      queryClient.setQueryData(queryKeys.proposal.detail(proposal.proposalId), (current: unknown) =>
        current && typeof current === "object" ? { ...(current as object), ...proposal } : current,
      );
    },
  });
}

export function usePublishProposalMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, note }: { proposalId: string } & PublishProposalRequestDto) =>
      publishProposalApi(proposalId, { note }),
    onSuccess: (_data, variables) => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.proposals(projectId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.proposal.detail(variables.proposalId) });
    },
  });
}

export function useReopenProposalMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (proposalId: string) => reopenProposalApi(proposalId),
    onSuccess: (_data, proposalId) => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.proposals(projectId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.proposal.detail(proposalId) });
    },
  });
}

export function useCreateProposalSceneMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, ...payload }: CreateProposalSceneRequestDto & { proposalId: string }) =>
      createProposalSceneApi(proposalId, payload),
    onSuccess: (_scene, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.proposal.detail(variables.proposalId) });
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.proposals(projectId) });
      }
    },
  });
}

export function useDesignerSchedulesQuery(projectId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.project.schedules(projectId ?? "none"),
    enabled: isLoggedIn && Boolean(projectId),
    queryFn: () => getProjectSchedulesApi(projectId!),
  });
}

export function useDesignerAreasQuery(projectId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.sale.areas(projectId ?? "none"),
    enabled: isLoggedIn && Boolean(projectId),
    queryFn: () => getProjectAreasApi(projectId!),
  });
}

export function useDesignerMeasurementImagesQuery(
  projectId: string | null,
  query: ProjectMeasurementImagesQuery = {},
) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.sale.measurementImages(projectId ?? "none", query),
    enabled: isLoggedIn && Boolean(projectId),
    queryFn: () => getProjectMeasurementImagesApi(projectId!, query),
  });
}

export function useScheduleMeasurementImagesQuery(scheduleId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.designer.scheduleMeasurementImages(scheduleId ?? "none"),
    enabled: isLoggedIn && Boolean(scheduleId),
    queryFn: () => getScheduleMeasurementImagesApi(scheduleId!),
  });
}

export function useUploadMeasurementImageMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadMeasurementImageInput) => uploadScheduleMeasurementImageApi(input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.designer.scheduleMeasurementImages(variables.scheduleId),
      });
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.measurementImages(projectId) });
      }
    },
  });
}

export function useDesignerMySchedulesQuery(
  query: {
    scheduleType?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const page = query.page ?? 1;
  const limit = query.limit ?? 5;
  return useQuery({
    queryKey: queryKeys.projectSchedule.myAssigned({ ...query, page, limit }),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
    queryFn: () =>
      getMyAssignedSchedulesApi({
        ...(query.scheduleType ? { scheduleType: query.scheduleType } : {}),
        ...(query.status ? { status: query.status } : {}),
        page,
        limit,
      }),
  });
}

export function useUpdateScheduleStatusMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      scheduleId,
      payload,
    }: {
      scheduleId: string;
      payload: UpdateProjectScheduleStatusRequestDto;
    }) => updateProjectScheduleStatusApi(scheduleId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["project-schedule", "my-assigned"] });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectSchedule.detail(variables.scheduleId),
      });
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.schedules(projectId) });
      } else {
        void queryClient.invalidateQueries({ queryKey: ["project", "schedules"] });
      }
    },
  });
}

export function mapDesignerKpisToMetrics(kpis: DesignerKpisDto): Array<{
  value: string;
  label: string;
  color: string;
}> {
  return [
    { value: String(kpis.measurementDue), label: "Measurement due", color: "#B45309" },
    { value: String(kpis.proposalsInProgress), label: "Proposals in progress", color: "#2F5D50" },
    { value: String(kpis.revisionRequested), label: "Revision requested", color: "#C9A86A" },
    { value: String(kpis.overdueTasks), label: "Overdue tasks", color: "#DC2626" },
  ];
}

export function getPriorityColor(priority: string): string {
  const value = priority.toUpperCase();
  if (value === "URGENT" || value === "HIGH") {
    return "#DC2626";
  }
  if (value === "MEDIUM") {
    return "#B45309";
  }
  return "#7A6F68";
}
