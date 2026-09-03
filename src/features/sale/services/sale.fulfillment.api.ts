import { endpoints } from "../../../core/api/endpoints";
import { httpClient } from "../../../core/api/httpClient";
import { ApiResponse } from "../../../shared/types/api";
import type { PhaseDeadlinesResponseDto } from "../../project/models/project.tracking.model";
import { PaymentDetailDto } from "../../payment/models/payment.model";
import {
  AssignProductionRequestDto,
  AvailableProductionStaffDto,
  AvailableProductionStaffListResponseDto,
  CompleteOrderResponseDto,
  CreateOrderPaymentRequestDto,
  CreateProductionRequestDto,
  DeliveryDto,
  DeliveryListResponseDto,
  DeliveryTrackingDto,
  OrderPaymentsResponseDto,
  ProductionRequestDto,
  SaleOrderDetailDto,
  SaleOrderListResponseDto,
  UpsertProductionPhaseDeadlineRequestDto,
} from "../models/sale.fulfillment.model";
import { mapSaleOrderDetail, mapSaleOrderListItem } from "../utils/sale.order.mapper";

function unwrapList<T>(data: { items?: T[] } | T[] | null | undefined): T[] {
  if (!data) {
    return [];
  }
  if (Array.isArray(data)) {
    return data;
  }
  return data.items ?? [];
}

export async function getSaleProjectOrdersApi(projectId: string): Promise<SaleOrderDetailDto[]> {
  const response = await httpClient.get<ApiResponse<SaleOrderListResponseDto | SaleOrderDetailDto[]>>(
    endpoints.projects.orders(projectId),
  );
  return unwrapList(response.data.data)
    .map((item) => mapSaleOrderListItem(item))
    .filter((item): item is SaleOrderDetailDto => item != null);
}

export async function getSaleOrderByIdApi(orderId: string): Promise<SaleOrderDetailDto> {
  const response = await httpClient.get<ApiResponse<SaleOrderDetailDto>>(endpoints.orders.detail(orderId));
  return mapSaleOrderDetail(response.data.data);
}

export async function getSaleOrderPaymentsApi(
  orderId: string,
  query: { status?: string; paymentType?: string } = {},
): Promise<OrderPaymentsResponseDto> {
  const response = await httpClient.get<ApiResponse<OrderPaymentsResponseDto>>(endpoints.orders.payments(orderId), {
    params: query,
  });
  return {
    ...response.data.data,
    payments: response.data.data.payments ?? [],
  };
}

export async function putProductionPhaseDeadlineApi(
  projectId: string,
  payload: UpsertProductionPhaseDeadlineRequestDto,
): Promise<PhaseDeadlinesResponseDto> {
  const response = await httpClient.put<ApiResponse<PhaseDeadlinesResponseDto>>(
    endpoints.projects.updateProductionPhaseDeadline(projectId),
    payload,
  );
  return response.data.data;
}

export async function createSaleOrderDepositPaymentApi(
  orderId: string,
  payload: CreateOrderPaymentRequestDto = {},
): Promise<PaymentDetailDto> {
  const response = await httpClient.post<ApiResponse<PaymentDetailDto>>(
    endpoints.orders.createDeposit(orderId),
    payload,
  );
  return response.data.data;
}

export async function createSaleOrderRemainingPaymentApi(
  orderId: string,
  payload: CreateOrderPaymentRequestDto = {},
): Promise<PaymentDetailDto> {
  const response = await httpClient.post<ApiResponse<PaymentDetailDto>>(
    endpoints.orders.createRemaining(orderId),
    payload,
  );
  return response.data.data;
}

export async function prepareFinalPaymentApi(orderId: string): Promise<SaleOrderDetailDto> {
  const response = await httpClient.patch<ApiResponse<SaleOrderDetailDto>>(
    endpoints.orders.prepareFinalPayment(orderId),
    {},
  );
  return response.data.data;
}

export async function completeOrderApi(orderId: string): Promise<CompleteOrderResponseDto> {
  const response = await httpClient.patch<ApiResponse<CompleteOrderResponseDto>>(endpoints.orders.complete(orderId), {});
  return response.data.data;
}

export async function completeProjectApi(projectId: string): Promise<unknown> {
  const response = await httpClient.patch<ApiResponse<unknown>>(endpoints.projects.complete(projectId), {});
  return response.data.data;
}

export async function getAvailableProductionStaffApi(query: {
  projectId?: string;
  productionRequestId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<AvailableProductionStaffDto[]> {
  const response = await httpClient.get<
    ApiResponse<AvailableProductionStaffListResponseDto | AvailableProductionStaffDto[]>
  >(endpoints.productionStaff.available, { params: query });
  return unwrapList(response.data.data);
}

export async function createProductionRequestApi(
  orderId: string,
  payload: CreateProductionRequestDto,
): Promise<ProductionRequestDto> {
  const response = await httpClient.post<ApiResponse<ProductionRequestDto>>(
    endpoints.orders.productionRequest(orderId),
    payload,
  );
  return response.data.data;
}

export async function getProductionRequestByIdApi(productionRequestId: string): Promise<ProductionRequestDto> {
  const response = await httpClient.get<ApiResponse<ProductionRequestDto>>(
    endpoints.productionRequests.detail(productionRequestId),
  );
  return response.data.data;
}

export async function getProductionRequestsApi(query: {
  projectId?: string;
  orderId?: string;
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<ProductionRequestDto[]> {
  const response = await httpClient.get<ApiResponse<{ items?: ProductionRequestDto[] } | ProductionRequestDto[]>>(
    endpoints.productionRequests.list,
    { params: query },
  );
  return unwrapList(response.data.data);
}

export async function assignProductionRequestApi(
  productionRequestId: string,
  payload: AssignProductionRequestDto,
): Promise<ProductionRequestDto> {
  const response = await httpClient.patch<ApiResponse<ProductionRequestDto>>(
    endpoints.productionRequests.assign(productionRequestId),
    payload,
  );
  return response.data.data;
}

export async function getOrderDeliveriesApi(orderId: string): Promise<DeliveryDto[]> {
  const response = await httpClient.get<ApiResponse<DeliveryListResponseDto | DeliveryDto[]>>(
    endpoints.orders.deliveries(orderId),
  );
  return unwrapList(response.data.data);
}

export async function getOrderDeliveryByIdApi(orderId: string, deliveryId: string): Promise<DeliveryDto> {
  const response = await httpClient.get<ApiResponse<DeliveryDto>>(
    endpoints.orders.deliveryDetail(orderId, deliveryId),
  );
  return response.data.data;
}

export async function getOrderDeliveryTrackingApi(orderId: string): Promise<DeliveryTrackingDto> {
  const response = await httpClient.get<ApiResponse<DeliveryTrackingDto>>(
    endpoints.orders.deliveryTracking(orderId),
  );
  return response.data.data;
}
