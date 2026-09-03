import { endpoints } from "../../../core/api/endpoints";
import { httpClient } from "../../../core/api/httpClient";
import { ApiResponse } from "../../../shared/types/api";
import { OrderListResponseDto } from "../models/order.model";
import { normalizeOrderListItem, resolveOrderDisplayTotal } from "../utils/order.mapper";
import { normalizeProjectSchedule } from "../utils/schedule.mapper";
import {
  ConfirmOrderDeliveryResponseDto,
  OrderDto,
  PhaseDeadlinesResponseDto,
  ProjectScheduleDto,
  ProjectScheduleListResponseDto,
  UpdateOrderDeliveryDetailsRequestDto,
  UpdateProjectScheduleStatusRequestDto,
} from "../models/project.tracking.model";

export async function getProjectPhaseDeadlinesApi(projectId: string): Promise<PhaseDeadlinesResponseDto> {
  const response = await httpClient.get<ApiResponse<PhaseDeadlinesResponseDto>>(
    endpoints.projects.phaseDeadlines(projectId),
  );
  return response.data.data;
}

export async function getProjectSchedulesApi(
  projectId: string,
  query: { scheduleType?: string; status?: string; page?: number; limit?: number } = {},
): Promise<ProjectScheduleDto[]> {
  const response = await httpClient.get<ApiResponse<ProjectScheduleListResponseDto>>(endpoints.projectSchedules.list, {
    params: {
      projectId,
      ...(query.scheduleType ? { scheduleType: query.scheduleType } : {}),
      ...(query.status ? { status: query.status } : {}),
      page: query.page ?? 1,
      limit: query.limit ?? 50,
    },
  });
  const data = response.data.data;
  const items = data.items ?? (Array.isArray(data) ? (data as unknown as unknown[]) : []);
  return items
    .map((item) => normalizeProjectSchedule(item))
    .filter((item): item is ProjectScheduleDto => item != null && Boolean(item.scheduleId));
}

export async function confirmProjectScheduleApi(
  scheduleId: string,
  note?: string,
): Promise<ProjectScheduleDto> {
  const payload: UpdateProjectScheduleStatusRequestDto = {
    status: "CONFIRMED",
    ...(note?.trim() ? { note: note.trim() } : { note: "Customer confirmed" }),
  };
  const response = await httpClient.patch<ApiResponse<unknown>>(
    endpoints.projectSchedules.updateStatus(scheduleId),
    payload,
  );
  const normalized = normalizeProjectSchedule(response.data.data);
  if (!normalized) {
    throw new Error("Invalid schedule response");
  }
  return normalized;
}

export async function getProjectOrdersApi(projectId: string): Promise<OrderDto[]> {
  const response = await httpClient.get<ApiResponse<OrderListResponseDto>>(endpoints.projects.orders(projectId));
  const data = response.data.data;
  const items = data.items ?? [];

  return items
    .map((item) => normalizeOrderListItem(item))
    .filter((item): item is NonNullable<ReturnType<typeof normalizeOrderListItem>> => item != null)
    .map((item) => ({
      orderId: item.orderId,
      projectId: item.projectId,
      orderCode: item.orderCode,
      status: item.status,
      totalAmount: resolveOrderDisplayTotal(item),
      paidAmount: item.paidAmount,
      remainingAmount: item.remainingAmount,
      createdAt: item.createdAt,
    }));
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
