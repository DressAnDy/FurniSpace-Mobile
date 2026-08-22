import { endpoints } from "../../../core/api/endpoints";
import { httpClient } from "../../../core/api/httpClient";
import { ApiResponse } from "../../../shared/types/api";
import {
  QuotationDetailDto,
  QuotationListQuery,
  QuotationListResponseDto,
  RejectQuotationRequestDto,
  RequestQuotationRevisionRequestDto,
} from "../models/quotation.model";
import { normalizeQuotationDetail, normalizeQuotationList } from "../utils/quotation.mapper";

export async function getProjectQuotationsApi(
  projectId: string,
  query: QuotationListQuery = {},
): Promise<QuotationListResponseDto> {
  const response = await httpClient.get<ApiResponse<QuotationListResponseDto>>(
    endpoints.projects.quotations(projectId),
    {
      params: {
        ...(query.status ? { status: query.status } : {}),
        page: query.page ?? 1,
        limit: query.limit ?? 20,
      },
    },
  );
  return {
    ...response.data.data,
    items: normalizeQuotationList(response.data.data.items),
  };
}

export async function getQuotationByIdApi(quotationId: string): Promise<QuotationDetailDto> {
  const response = await httpClient.get<ApiResponse<QuotationDetailDto>>(endpoints.quotations.detail(quotationId));
  return normalizeQuotationDetail(response.data.data);
}

export async function acceptQuotationApi(quotationId: string): Promise<QuotationDetailDto> {
  const response = await httpClient.patch<ApiResponse<QuotationDetailDto>>(endpoints.quotations.accept(quotationId));
  return normalizeQuotationDetail(response.data.data);
}

export async function requestQuotationRevisionApi(
  quotationId: string,
  payload: RequestQuotationRevisionRequestDto,
): Promise<QuotationDetailDto> {
  const response = await httpClient.patch<ApiResponse<QuotationDetailDto>>(
    endpoints.quotations.requestRevision(quotationId),
    payload,
  );
  return normalizeQuotationDetail(response.data.data);
}

export async function rejectQuotationApi(
  quotationId: string,
  payload: RejectQuotationRequestDto,
): Promise<QuotationDetailDto> {
  const response = await httpClient.patch<ApiResponse<QuotationDetailDto>>(
    endpoints.quotations.reject(quotationId),
    payload,
  );
  return normalizeQuotationDetail(response.data.data);
}
