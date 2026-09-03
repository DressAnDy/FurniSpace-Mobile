import { endpoints } from "../../../core/api/endpoints";
import { httpClient } from "../../../core/api/httpClient";
import { ApiResponse } from "../../../shared/types/api";
import {
  ProposalDetailDto,
  ProposalItemListQuery,
  ProposalItemListResponseDto,
  ProposalListQuery,
  ProposalListResponseDto,
  PublishedProposalDto,
  RequestProposalRevisionRequestDto,
  RequestProposalRevisionResponseDto,
  SelectFinalProposalRequestDto,
  SelectFinalProposalResponseDto,
} from "../models/proposal.model";
import { normalizeProposalItems } from "../utils/proposal.mapper";

export async function getProjectProposalsApi(
  projectId: string,
  query: ProposalListQuery = {},
): Promise<ProposalListResponseDto> {
  const response = await httpClient.get<ApiResponse<ProposalListResponseDto>>(endpoints.projects.proposals(projectId), {
    params: {
      ...(query.status ? { status: query.status } : {}),
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    },
  });
  return response.data.data;
}

export async function getPublishedProposalApi(projectId: string): Promise<PublishedProposalDto> {
  const response = await httpClient.get<ApiResponse<PublishedProposalDto>>(
    endpoints.projects.publishedProposal(projectId),
  );
  return response.data.data;
}

export async function getProposalByIdApi(proposalId: string): Promise<ProposalDetailDto> {
  const response = await httpClient.get<ApiResponse<ProposalDetailDto>>(endpoints.proposals.detail(proposalId));
  const data = response.data.data;

  return {
    ...data,
    items: normalizeProposalItems(data.items),
  };
}

export async function getProposalItemsApi(
  proposalId: string,
  query: ProposalItemListQuery = {},
): Promise<ProposalItemListResponseDto> {
  const response = await httpClient.get<ApiResponse<ProposalItemListResponseDto>>(endpoints.proposals.items(proposalId), {
    params: {
      ...(query.sceneId ? { sceneId: query.sceneId } : {}),
      page: query.page ?? 1,
      limit: query.limit ?? 50,
    },
  });

  const data = response.data.data;

  return {
    ...data,
    items: normalizeProposalItems(data.items),
  };
}

export async function selectFinalProposalApi(
  proposalId: string,
  payload: SelectFinalProposalRequestDto = {},
): Promise<SelectFinalProposalResponseDto> {
  const response = await httpClient.patch<ApiResponse<SelectFinalProposalResponseDto>>(
    endpoints.proposals.selectFinal(proposalId),
    payload,
  );
  return response.data.data;
}

export async function requestProposalRevisionApi(
  proposalId: string,
  payload: RequestProposalRevisionRequestDto,
): Promise<RequestProposalRevisionResponseDto> {
  const response = await httpClient.patch<ApiResponse<RequestProposalRevisionResponseDto>>(
    endpoints.proposals.requestRevision(proposalId),
    payload,
  );
  return response.data.data;
}
