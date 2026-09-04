import { endpoints } from "../../../core/api/endpoints";
import { httpClient } from "../../../core/api/httpClient";
import { ApiResponse } from "../../../shared/types/api";
import {
  BulkQuotationFinancialsRequestDto,
  CreateProposalSceneRequestDto,
  ProposalDetailDto,
  ProposalListResponseDto,
  ProposalSceneDto,
  ProposalSummaryDto,
  PublishProposalRequestDto,
  QuotationDetailDto,
  QuotationListResponseDto,
  QuotationSummaryDto,
  UpdateProposalItemRequestDto,
  UpdateQuotationHeaderRequestDto,
  UpdateQuotationItemFinancialsRequestDto,
  UpsertProposalRequestDto,
} from "../models/sale.commercial.model";
import { mapSaleQuotationDetail, mapSaleQuotationList } from "../utils/sale.quotation.mapper";

function unwrapList<T>(data: { items?: T[] } | T[] | null | undefined): T[] {
  if (!data) {
    return [];
  }
  if (Array.isArray(data)) {
    return data;
  }
  return data.items ?? [];
}

export async function getProjectProposalsApi(projectId: string): Promise<ProposalSummaryDto[]> {
  const response = await httpClient.get<ApiResponse<ProposalListResponseDto | ProposalSummaryDto[]>>(
    endpoints.projects.proposals(projectId),
  );
  return unwrapList(response.data.data);
}

export async function getProposalByIdApi(proposalId: string): Promise<ProposalDetailDto> {
  const response = await httpClient.get<ApiResponse<ProposalDetailDto>>(endpoints.proposals.detail(proposalId));
  return response.data.data;
}

export async function createProposalApi(
  projectId: string,
  payload: UpsertProposalRequestDto,
): Promise<ProposalDetailDto> {
  const response = await httpClient.post<ApiResponse<ProposalDetailDto>>(
    endpoints.projects.proposals(projectId),
    payload,
  );
  return response.data.data;
}

export async function updateProposalApi(
  proposalId: string,
  payload: UpsertProposalRequestDto,
): Promise<ProposalDetailDto> {
  const response = await httpClient.patch<ApiResponse<ProposalDetailDto>>(
    endpoints.proposals.update(proposalId),
    payload,
  );
  return response.data.data;
}

export async function publishProposalApi(
  proposalId: string,
  payload: PublishProposalRequestDto = {},
): Promise<ProposalDetailDto> {
  const response = await httpClient.patch<ApiResponse<ProposalDetailDto>>(
    endpoints.proposals.publish(proposalId),
    payload,
  );
  return response.data.data;
}

export async function reopenProposalForEditingApi(proposalId: string): Promise<ProposalDetailDto> {
  const response = await httpClient.post<ApiResponse<ProposalDetailDto>>(endpoints.proposals.reopen(proposalId), {});
  return response.data.data;
}

export async function createProposalSceneApi(
  proposalId: string,
  payload: CreateProposalSceneRequestDto,
): Promise<ProposalSceneDto> {
  const response = await httpClient.post<ApiResponse<ProposalSceneDto>>(endpoints.proposals.scenes(proposalId), payload);
  return response.data.data;
}

export async function updateProposalSceneApi(
  sceneId: string,
  payload: Partial<CreateProposalSceneRequestDto>,
): Promise<ProposalSceneDto> {
  const response = await httpClient.patch<ApiResponse<ProposalSceneDto>>(
    endpoints.proposalScenes.update(sceneId),
    payload,
  );
  return response.data.data;
}

export async function updateProposalItemApi(
  itemId: string,
  payload: UpdateProposalItemRequestDto,
): Promise<unknown> {
  const response = await httpClient.patch<ApiResponse<unknown>>(endpoints.proposalItems.update(itemId), payload);
  return response.data.data;
}

export async function deleteProposalItemApi(itemId: string): Promise<void> {
  await httpClient.delete<ApiResponse<null>>(endpoints.proposalItems.delete(itemId));
}

export async function getProjectQuotationsApi(
  projectId: string,
  status?: string,
): Promise<QuotationSummaryDto[]> {
  const response = await httpClient.get<ApiResponse<QuotationListResponseDto | QuotationSummaryDto[]>>(
    endpoints.projects.quotations(projectId),
    { params: status ? { status } : undefined },
  );
  const rawItems = unwrapList(response.data.data);
  return mapSaleQuotationList(rawItems);
}

export async function getQuotationByIdApi(quotationId: string): Promise<QuotationDetailDto> {
  const response = await httpClient.get<ApiResponse<QuotationDetailDto>>(endpoints.quotations.detail(quotationId));
  return mapSaleQuotationDetail(response.data.data);
}

export async function createQuotationApi(projectId: string): Promise<QuotationDetailDto> {
  const response = await httpClient.post<ApiResponse<QuotationDetailDto>>(
    endpoints.projects.quotations(projectId),
    {},
  );
  return mapSaleQuotationDetail(response.data.data);
}

export async function updateQuotationHeaderApi(
  quotationId: string,
  payload: UpdateQuotationHeaderRequestDto,
): Promise<QuotationDetailDto> {
  const response = await httpClient.patch<ApiResponse<QuotationDetailDto>>(
    endpoints.quotations.update(quotationId),
    payload,
  );
  return mapSaleQuotationDetail(response.data.data);
}

export async function updateQuotationItemFinancialsApi(
  quotationId: string,
  itemId: string,
  payload: UpdateQuotationItemFinancialsRequestDto,
): Promise<QuotationDetailDto> {
  const response = await httpClient.patch<ApiResponse<QuotationDetailDto>>(
    endpoints.quotations.itemFinancials(quotationId, itemId),
    payload,
  );
  return mapSaleQuotationDetail(response.data.data);
}

export async function bulkUpdateQuotationFinancialsApi(
  quotationId: string,
  payload: BulkQuotationFinancialsRequestDto,
): Promise<QuotationDetailDto> {
  const response = await httpClient.put<ApiResponse<QuotationDetailDto>>(
    endpoints.quotations.bulkFinancials(quotationId),
    payload,
  );
  return mapSaleQuotationDetail(response.data.data);
}

export async function sendQuotationApi(quotationId: string): Promise<QuotationDetailDto> {
  const response = await httpClient.patch<ApiResponse<QuotationDetailDto>>(endpoints.quotations.send(quotationId), {});
  return mapSaleQuotationDetail(response.data.data);
}

export async function reviseQuotationApi(quotationId: string): Promise<QuotationDetailDto> {
  const response = await httpClient.patch<ApiResponse<QuotationDetailDto>>(endpoints.quotations.revise(quotationId), {});
  return mapSaleQuotationDetail(response.data.data);
}

export async function cancelQuotationApi(quotationId: string): Promise<QuotationDetailDto> {
  const response = await httpClient.patch<ApiResponse<QuotationDetailDto>>(endpoints.quotations.cancel(quotationId), {});
  return mapSaleQuotationDetail(response.data.data);
}
