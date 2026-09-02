import { endpoints } from "../../../core/api/endpoints";
import { httpClient } from "../../../core/api/httpClient";
import { ApiResponse } from "../../../shared/types/api";
import {
  ConfirmOrderDeliveryResponseDto,
  OrderDto,
  OrderListResponseDto,
  PhaseDeadlinesResponseDto,
  ProjectScheduleDto,
  ProjectScheduleListResponseDto,
  UpdateOrderDeliveryDetailsRequestDto,
  UpdateProjectScheduleStatusRequestDto,
} from "../models/project.tracking.model";

function normalizeSchedule(item: ProjectScheduleDto): ProjectScheduleDto {
  const scheduledStart = item.scheduledStart || item.scheduledAt || "";
  const scheduledEnd = item.scheduledEnd ?? item.endAt ?? null;

  return {
    ...item,
    scheduledStart,
    scheduledEnd,
    // Keep legacy aliases populated so older UI helpers stay safe.
    scheduledAt: scheduledStart,
    endAt: scheduledEnd,
  };
}

export async function getProjectPhaseDeadlinesApi(projectId: string): Promise<PhaseDeadlinesResponseDto> {
  const response = await httpClient.get<ApiResponse<PhaseDeadlinesResponseDto>>(
    endpoints.projects.phaseDeadlines(projectId),
  );
  return response.data.data;
}

export async function getProjectSchedulesApi(projectId: string): Promise<ProjectScheduleDto[]> {
  const response = await httpClient.get<ApiResponse<ProjectScheduleListResponseDto>>(endpoints.projectSchedules.list, {
    params: { projectId, page: 1, limit: 50 },
  });
  const data = response.data.data;
  const items = data.items ?? (Array.isArray(data) ? (data as unknown as ProjectScheduleDto[]) : []);
  return items.map(normalizeSchedule);
}

export async function confirmProjectScheduleApi(
  scheduleId: string,
  note?: string,
): Promise<ProjectScheduleDto> {
  const payload: UpdateProjectScheduleStatusRequestDto = {
    status: "CONFIRMED",
    ...(note?.trim() ? { note: note.trim() } : { note: "Customer confirmed" }),
  };
  const response = await httpClient.patch<ApiResponse<ProjectScheduleDto>>(
    endpoints.projectSchedules.updateStatus(scheduleId),
    payload,
  );
  return normalizeSchedule(response.data.data);
}

export async function getProjectOrdersApi(projectId: string): Promise<OrderDto[]> {
  const response = await httpClient.get<ApiResponse<OrderListResponseDto>>(endpoints.projects.orders(projectId));
  const data = response.data.data;
  return data.items ?? (Array.isArray(data) ? (data as unknown as OrderDto[]) : []);
}

export async function getOrderByIdApi(orderId: string): Promise<OrderDto> {
  const response = await httpClient.get<ApiResponse<OrderDto>>(endpoints.orders.detail(orderId));
  return response.data.data;
}

export async function updateOrderDeliveryDetailsApi(
  orderId: string,
  payload: UpdateOrderDeliveryDetailsRequestDto,
): Promise<OrderDto> {
  const response = await httpClient.patch<ApiResponse<OrderDto>>(endpoints.orders.deliveryDetails(orderId), payload);
  return response.data.data;
}

export async function confirmOrderDeliveryApi(orderId: string): Promise<ConfirmOrderDeliveryResponseDto> {
  const response = await httpClient.patch<ApiResponse<ConfirmOrderDeliveryResponseDto>>(
    endpoints.orders.confirmDelivery(orderId),
  );
  return response.data.data;
}

export function hasOrderDeliveryDetails(order: Pick<OrderDto, "deliveryAddress" | "receiverName" | "receiverPhone">): boolean {
  return Boolean(order.deliveryAddress?.trim() && order.receiverName?.trim() && order.receiverPhone?.trim());
}

export function isDepositEligibleOrderStatus(status: string): boolean {
  return status === "CREATED" || status === "DEPOSIT_PENDING" || status === "PENDING_DEPOSIT";
}

export function getScheduleStartAt(schedule: ProjectScheduleDto): string {
  return schedule.scheduledStart || schedule.scheduledAt || "";
}
