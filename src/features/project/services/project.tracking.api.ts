import { endpoints } from "../../../core/api/endpoints";
import { httpClient } from "../../../core/api/httpClient";
import { ApiResponse } from "../../../shared/types/api";
import {
  OrderDto,
  OrderListResponseDto,
  PhaseDeadlinesResponseDto,
  ProjectScheduleDto,
  ProjectScheduleListResponseDto,
  UpdateProjectScheduleStatusRequestDto,
} from "../models/project.tracking.model";

export async function getProjectPhaseDeadlinesApi(projectId: string): Promise<PhaseDeadlinesResponseDto> {
  const response = await httpClient.get<ApiResponse<PhaseDeadlinesResponseDto>>(
    endpoints.projects.phaseDeadlines(projectId),
  );
  return response.data.data;
}

export async function getProjectSchedulesApi(projectId: string): Promise<ProjectScheduleDto[]> {
  const response = await httpClient.get<ApiResponse<ProjectScheduleListResponseDto>>(endpoints.projectSchedules.list, {
    params: { projectId },
  });
  const data = response.data.data;
  return data.items ?? (Array.isArray(data) ? (data as unknown as ProjectScheduleDto[]) : []);
}

export async function confirmProjectScheduleApi(scheduleId: string): Promise<ProjectScheduleDto> {
  const payload: UpdateProjectScheduleStatusRequestDto = { status: "CONFIRMED" };
  const response = await httpClient.patch<ApiResponse<ProjectScheduleDto>>(
    endpoints.projectSchedules.updateStatus(scheduleId),
    payload,
  );
  return response.data.data;
}

export async function getProjectOrdersApi(projectId: string): Promise<OrderDto[]> {
  const response = await httpClient.get<ApiResponse<OrderListResponseDto>>(endpoints.projects.orders(projectId));
  const data = response.data.data;
  return data.items ?? (Array.isArray(data) ? (data as unknown as OrderDto[]) : []);
}

export async function confirmOrderDeliveryApi(orderId: string): Promise<OrderDto> {
  const response = await httpClient.patch<ApiResponse<OrderDto>>(endpoints.orders.confirmDelivery(orderId));
  return response.data.data;
}
