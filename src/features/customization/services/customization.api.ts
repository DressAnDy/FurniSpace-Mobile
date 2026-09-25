import { endpoints } from "../../../core/api/endpoints";
import { httpClient } from "../../../core/api/httpClient";
import { ApiResponse } from "../../../shared/types/api";
import {
  AcceptCustomizationRequestDto,
  CustomizationRequestDto,
  CustomizationRequestListQuery,
  CustomizationRequestListResponseDto,
  SubmitCustomizationRequestDto,
} from "../models/customization.model";
import { normalizeCustomizationRequest, normalizeCustomizationRequestList } from "../utils/customization.mapper";

export async function getProjectCustomizationRequestsApi(
  projectId: string,
  query: CustomizationRequestListQuery = {},
): Promise<CustomizationRequestListResponseDto> {
  const response = await httpClient.get<ApiResponse<unknown>>(endpoints.customizationRequests.byProject(projectId), {
    params: {
      ...(query.proposalId ? { proposalId: query.proposalId } : {}),
      ...(query.sourceProductVersionId ? { sourceProductVersionId: query.sourceProductVersionId } : {}),
      ...(query.status ? { status: query.status } : {}),
    },
  });

  return { items: normalizeCustomizationRequestList(response.data.data) };
}

export async function getCustomizationRequestApi(customizationRequestId: string): Promise<CustomizationRequestDto> {
  const response = await httpClient.get<ApiResponse<unknown>>(
    endpoints.customizationRequests.detail(customizationRequestId),
  );
  const request = normalizeCustomizationRequest(response.data.data);
  if (!request) {
    throw new Error("Unable to read this customization request.");
  }

  return request;
}

export async function submitCustomizationRequestApi(
  proposalItemId: string,
  payload: SubmitCustomizationRequestDto,
): Promise<CustomizationRequestDto> {
  const response = await httpClient.post<ApiResponse<unknown>>(
    endpoints.proposalItems.customizationRequests(proposalItemId),
    payload,
  );
  const request = normalizeCustomizationRequest(response.data.data);
  if (!request) {
    throw new Error("Unable to read the submitted customization request.");
  }

  return request;
}

export async function acceptCustomizationRequestApi(
  customizationRequestId: string,
  payload: AcceptCustomizationRequestDto,
): Promise<CustomizationRequestDto> {
  const response = await httpClient.post<ApiResponse<unknown>>(
    endpoints.customizationRequests.accept(customizationRequestId),
    payload,
  );
  const request = normalizeCustomizationRequest(response.data.data);
  if (!request) {
    throw new Error("Unable to read the accepted customization request.");
  }

  return request;
}
