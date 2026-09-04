import { endpoints } from "../../../core/api/endpoints";
import { httpClient } from "../../../core/api/httpClient";
import { ApiResponse } from "../../../shared/types/api";
import {
  ClaimSalesAssignmentRequestDto,
  ClaimSalesAssignmentResponseDto,
  DashboardPhaseDeadlinesQuery,
  DashboardPhaseDeadlinesResponseDto,
  RequestProjectInformationDto,
  RequestProjectInformationResponseDto,
  SalesActionQueueQuery,
  SalesActionQueueResponseDto,
  SalesKpisDto,
  SalesKpisQuery,
} from "../models/sale.model";

export async function getSalesKpisApi(query: SalesKpisQuery = {}): Promise<SalesKpisDto> {
  const response = await httpClient.get<ApiResponse<SalesKpisDto>>(endpoints.saleDashboard.kpis, {
    params: {
      scope: query.scope ?? "mine",
      dateRange: query.dateRange ?? "thisWeek",
      ...(query.search ? { search: query.search } : {}),
    },
  });
  return response.data.data;
}

export async function getSalesActionQueueApi(
  query: SalesActionQueueQuery = {},
): Promise<SalesActionQueueResponseDto> {
  const response = await httpClient.get<ApiResponse<SalesActionQueueResponseDto>>(
    endpoints.saleDashboard.actionQueue,
    {
      params: {
        scope: query.scope ?? "mine",
        ...(query.group ? { group: query.group } : {}),
        dateRange: query.dateRange ?? "thisWeek",
        ...(query.priority ? { priority: query.priority } : {}),
        ...(query.search ? { search: query.search } : {}),
        page: query.page ?? 1,
        limit: query.limit ?? 20,
      },
    },
  );
  return response.data.data;
}

export async function getDashboardProjectPhaseDeadlinesApi(
  query: DashboardPhaseDeadlinesQuery = {},
): Promise<DashboardPhaseDeadlinesResponseDto> {
  const response = await httpClient.get<ApiResponse<DashboardPhaseDeadlinesResponseDto>>(
    endpoints.saleDashboard.phaseDeadlines,
    {
      params: {
        ...(query.phase ? { phase: query.phase } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.salesId ? { salesId: query.salesId } : {}),
        ...(query.designerId ? { designerId: query.designerId } : {}),
        ...(query.productionId ? { productionId: query.productionId } : {}),
        ...(query.from ? { from: query.from } : {}),
        ...(query.to ? { to: query.to } : {}),
        page: query.page ?? 1,
        limit: query.limit ?? 20,
      },
    },
  );
  return response.data.data;
}

export async function claimSalesAssignmentApi(
  projectId: string,
  payload: ClaimSalesAssignmentRequestDto = {},
): Promise<ClaimSalesAssignmentResponseDto> {
  const response = await httpClient.patch<ApiResponse<ClaimSalesAssignmentResponseDto>>(
    endpoints.projects.salesAssignment(projectId),
    payload,
  );
  return response.data.data;
}

export async function requestProjectInformationApi(
  projectId: string,
  payload: RequestProjectInformationDto,
): Promise<RequestProjectInformationResponseDto> {
  const response = await httpClient.post<ApiResponse<RequestProjectInformationResponseDto>>(
    endpoints.projects.informationRequests(projectId),
    payload,
  );
  return response.data.data;
}

export type AvailableDesignerDto = {
  accountId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  status?: string | null;
  workload?: number | null;
  currentActiveProjectCount?: number | null;
  maxActiveProjects?: number | null;
  availableSlot?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type AvailableDesignersQuery = {
  page?: number;
  pageSize?: number;
  keyword?: string;
};

/** BE values for PATCH /projects/{id}/designer-assignment */
export type SpaceDataStatus = "INSUFFICIENT" | "SUFFICIENT";

export type AssignDesignerRequestDto = {
  designerId: string;
  spaceDataStatus: SpaceDataStatus;
  proposalDeadline: string;
  note?: string;
};

export type AssignDesignerResponseDto = {
  projectId: string;
  assignedDesigner?: {
    accountId: string;
    fullName: string;
    email?: string | null;
  };
  assignedDesignerId?: string;
  status: string;
  designerAssignedAt?: string;
  proposalDeadline?: string;
};

function unwrapDesignerList(data: unknown): AvailableDesignerDto[] {
  if (!data) {
    return [];
  }
  if (Array.isArray(data)) {
    return data as AvailableDesignerDto[];
  }
  if (typeof data === "object" && data !== null && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: AvailableDesignerDto[] }).items;
  }
  return [];
}

export async function getAvailableDesignersApi(
  query: AvailableDesignersQuery = {},
): Promise<AvailableDesignerDto[]> {
  const response = await httpClient.get<ApiResponse<AvailableDesignerDto[] | { items: AvailableDesignerDto[] }>>(
    endpoints.accounts.availableDesigners,
    {
      params: {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 10,
        ...(query.keyword ? { keyword: query.keyword } : {}),
      },
    },
  );
  return unwrapDesignerList(response.data.data);
}

export async function assignProjectDesignerApi(
  projectId: string,
  payload: AssignDesignerRequestDto,
): Promise<AssignDesignerResponseDto> {
  const response = await httpClient.patch<ApiResponse<AssignDesignerResponseDto>>(
    endpoints.projects.designerAssignment(projectId),
    payload,
  );
  return response.data.data;
}
