import { endpoints } from "../../../core/api/endpoints";
import { httpClient } from "../../../core/api/httpClient";
import { ApiResponse } from "../../../shared/types/api";
import {
  ClaimSalesAssignmentRequestDto,
  ClaimSalesAssignmentResponseDto,
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
