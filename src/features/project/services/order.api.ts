import { endpoints } from "../../../core/api/endpoints";
import { httpClient } from "../../../core/api/httpClient";
import { ApiResponse } from "../../../shared/types/api";
import { OrderDetailDto, OrderListItemDto, OrderListResponseDto } from "../models/order.model";
import { normalizeOrderDetail, normalizeOrderListItem } from "../utils/order.mapper";

export async function getProjectOrdersApi(projectId: string): Promise<OrderListItemDto[]> {
  const response = await httpClient.get<ApiResponse<OrderListResponseDto>>(endpoints.projects.orders(projectId));
  const data = response.data.data;
  const items = data.items ?? [];
  return items.map((item) => normalizeOrderListItem(item)).filter((item): item is OrderListItemDto => item != null);
}

export async function getOrderByIdApi(orderId: string): Promise<OrderDetailDto> {
  const response = await httpClient.get<ApiResponse<OrderDetailDto>>(endpoints.orders.detail(orderId));
  return normalizeOrderDetail(response.data.data);
}

export async function confirmOrderDeliveryApi(orderId: string): Promise<OrderDetailDto> {
  const response = await httpClient.patch<ApiResponse<OrderDetailDto>>(endpoints.orders.confirmDelivery(orderId));
  return normalizeOrderDetail(response.data.data);
}
