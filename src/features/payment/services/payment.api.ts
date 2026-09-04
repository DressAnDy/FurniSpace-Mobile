import { endpoints } from "../../../core/api/endpoints";
import { httpClient } from "../../../core/api/httpClient";
import { ApiResponse } from "../../../shared/types/api";
import {
  CancelPaymentTransactionRequestDto,
  CreateDepositRequestDto,
  CreatePayOsPaymentLinkRequestDto,
  CreateProjectStartFeeRequestDto,
  CreatePayOsTransactionRequestDto,
  CreatePaymentTransactionRequestDto,
  CreateSePayTransactionRequestDto,
  PayOsPaymentLinkDto,
  PaymentDetailDto,
  PaymentListQuery,
  PaymentListResponseDto,
  PaymentSummaryDto,
  ProjectStartFeePaymentDto,
  ProjectStartFeeStatusDto,
  PaymentStatusByCodeDto,
  PaymentTransactionDto,
  SePayVietQrDto,
} from "../models/payment.model";

export async function createOrderDepositPaymentApi(
  orderId: string,
  payload: CreateDepositRequestDto = {},
): Promise<PaymentDetailDto> {
  const response = await httpClient.post<ApiResponse<PaymentDetailDto>>(
    endpoints.orders.createDeposit(orderId),
    payload,
  );
  return response.data.data;
}

export async function getPaymentDetailApi(paymentId: string): Promise<PaymentDetailDto> {
  const response = await httpClient.get<ApiResponse<PaymentDetailDto>>(endpoints.payments.detail(paymentId));
  return response.data.data;
}

export async function getPaymentsApi(query: PaymentListQuery = {}): Promise<PaymentListResponseDto> {
  const response = await httpClient.get<ApiResponse<PaymentListResponseDto>>(endpoints.payments.list, {
    params: {
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.orderId ? { orderId: query.orderId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.paymentType ? { paymentType: query.paymentType } : {}),
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    },
  });
  return response.data.data;
}

export async function getPaymentSummaryApi(): Promise<PaymentSummaryDto> {
  const response = await httpClient.get<ApiResponse<PaymentSummaryDto>>(endpoints.payments.summary);
  return response.data.data;
}

export async function createProjectStartFeeApi(
  projectId: string,
  payload: CreateProjectStartFeeRequestDto = {},
): Promise<ProjectStartFeePaymentDto> {
  const response = await httpClient.post<ApiResponse<ProjectStartFeePaymentDto>>(
    endpoints.projectStartFee.create(projectId),
    payload,
  );
  return response.data.data;
}

export async function getProjectStartFeeStatusApi(projectId: string): Promise<ProjectStartFeeStatusDto> {
  const response = await httpClient.get<ApiResponse<ProjectStartFeeStatusDto>>(
    endpoints.projectStartFee.status(projectId),
  );
  return response.data.data;
}

export async function getPaymentStatusByCodeApi(paymentCode: string): Promise<PaymentStatusByCodeDto> {
  const response = await httpClient.get<ApiResponse<PaymentStatusByCodeDto>>(
    endpoints.payments.statusByCode(paymentCode),
  );
  return response.data.data;
}

export async function createPaymentTransactionApi(
  paymentId: string,
  payload: CreatePaymentTransactionRequestDto,
): Promise<PaymentTransactionDto> {
  const response = await httpClient.post<ApiResponse<PaymentTransactionDto>>(
    endpoints.payments.createTransaction(paymentId),
    payload,
  );
  return response.data.data;
}

export async function createSePayTransactionApi(paymentId: string): Promise<PaymentTransactionDto> {
  const payload: CreateSePayTransactionRequestDto = {
    paymentProvider: "SEPAY",
    paymentMethod: "QR_CODE",
  };
  return createPaymentTransactionApi(paymentId, payload);
}

export async function createPayOsTransactionApi(paymentId: string): Promise<PaymentTransactionDto> {
  const payload: CreatePayOsTransactionRequestDto = {
    paymentProvider: "PAYOS",
    paymentMethod: "PAYMENT_LINK",
  };
  return createPaymentTransactionApi(paymentId, payload);
}

export async function createSePayVietQrApi(paymentId: string): Promise<SePayVietQrDto> {
  const response = await httpClient.post<ApiResponse<SePayVietQrDto>>(endpoints.payments.sepayVietQr(paymentId), {});
  return response.data.data;
}

export async function createPayOsPaymentLinkApi(
  paymentId: string,
  payload: CreatePayOsPaymentLinkRequestDto = {},
): Promise<PayOsPaymentLinkDto> {
  const response = await httpClient.post<ApiResponse<PayOsPaymentLinkDto>>(
    endpoints.payments.payOsPaymentLink(paymentId),
    payload,
  );
  return response.data.data;
}

export async function getActivePaymentTransactionApi(paymentId: string): Promise<PaymentTransactionDto | null> {
  const response = await httpClient.get<ApiResponse<PaymentTransactionDto | null>>(
    endpoints.payments.activeTransaction(paymentId),
  );
  return response.data.data;
}

export async function cancelPaymentTransactionApi(
  paymentId: string,
  transactionId: string,
  payload: CancelPaymentTransactionRequestDto,
): Promise<PaymentTransactionDto> {
  const response = await httpClient.patch<ApiResponse<PaymentTransactionDto>>(
    endpoints.payments.cancelTransaction(paymentId, transactionId),
    payload,
  );
  return response.data.data;
}
