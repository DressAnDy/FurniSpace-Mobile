import { endpoints } from "../../../core/api/endpoints";
import { httpClient } from "../../../core/api/httpClient";
import { ApiResponse } from "../../../shared/types/api";
import { PaymentDetailDto } from "../../payment/models/payment.model";
import {
  AssignProductionRequestDto,
  AvailableProductionStaffDto,
  AvailableProductionStaffListResponseDto,
  CreateDeliveryRequestDto,
  CreateOrderPaymentRequestDto,
  CreateProductionRequestDto,
  DeliveryDto,
  DeliveryListResponseDto,
  DeliveryTrackingDto,
  ProductionRequestDto,
  SaleOrderDetailDto,
  SaleOrderListResponseDto,
} from "../models/sale.fulfillment.model";

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
  return unwrapList(response.data.data);
}

export async function getSaleOrderByIdApi(orderId: string): Promise<SaleOrderDetailDto> {
  const response = await httpClient.get<ApiResponse<SaleOrderDetailDto>>(endpoints.orders.detail(orderId));
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

export async function completeOrderApi(orderId: string): Promise<SaleOrderDetailDto> {
  const response = await httpClient.patch<ApiResponse<SaleOrderDetailDto>>(endpoints.orders.complete(orderId), {});
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

export async function createOrderDeliveryApi(
  orderId: string,
  payload: CreateDeliveryRequestDto,
): Promise<DeliveryDto> {
  const response = await httpClient.post<ApiResponse<DeliveryDto>>(endpoints.orders.deliveries(orderId), payload);
  return response.data.data;
}

export async function completeOrderDeliveryBatchApi(
  orderId: string,
  deliveryId: string,
): Promise<DeliveryDto> {
  const response = await httpClient.patch<ApiResponse<DeliveryDto>>(
    endpoints.orders.completeDelivery(orderId, deliveryId),
    {},
  );
  return response.data.data;
}
