import { endpoints } from "../../../core/api/endpoints";
import { httpClient } from "../../../core/api/httpClient";
import { getAccessToken } from "../../../core/storage/secureStorage";
import { env } from "../../../core/config/env";
import { ApiResponse } from "../../../shared/types/api";
import {
  CreateProposalRequestDto,
  CreateProposalSceneRequestDto,
  DesignerCatalogProductDto,
  DesignerCatalogProductListResponseDto,
  DesignerCatalogProductsQuery,
  DesignerCatalogVersionSummaryDto,
  DesignerKpisDto,
  DesignerKpisQuery,
  DesignerWorkQueueQuery,
  DesignerWorkQueueResponseDto,
  MeasurementImageUploadResponseDto,
  PublishProposalRequestDto,
  PublishProposalResponseDto,
  ReopenProposalResponseDto,
  UpdateProposalRequestDto,
  UploadMeasurementImageInput,
} from "../models/designer.model";
import { ProposalDetailDto, ProposalDto, ProposalSceneDto } from "../../project/models/proposal.model";
import { normalizeProposalItems } from "../../project/utils/proposal.mapper";
import {
  MEASUREMENT_UPLOAD_TIMEOUT_MS,
  prepareMeasurementImageForUpload,
} from "../utils/measurementImages";

let measurementUploadSequence = 0;

function resolveApiUrl(path: string): string {
  let apiUrl = env.apiUrl;
  while (apiUrl.endsWith("/")) {
    apiUrl = apiUrl.slice(0, -1);
  }
  return `${apiUrl}${path}`;
}

function sanitizeUploadFileName(name: string, mimeType: string): string {
  const trimmed = name.trim() || `measurement-${Date.now()}.jpg`;
  const safe = trimmed.replace(/[^\w.\-()+ ]+/g, "_");
  if (/\.(jpe?g|png|webp)$/i.test(safe)) {
    return safe;
  }
  if (mimeType.includes("png")) {
    return `${safe}.png`;
  }
  if (mimeType.includes("webp")) {
    return `${safe}.webp`;
  }
  return `${safe}.jpg`;
}

function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}
export async function getDesignerKpisApi(query: DesignerKpisQuery = {}): Promise<DesignerKpisDto> {
  const response = await httpClient.get<ApiResponse<DesignerKpisDto>>(endpoints.designerDashboard.kpis, {
    params: {
      scope: query.scope ?? "mine",
      dateRange: query.dateRange ?? "thisWeek",
      ...(query.search ? { search: query.search } : {}),
    },
  });
  return response.data.data;
}

export async function getDesignerWorkQueueApi(
  query: DesignerWorkQueueQuery = {},
): Promise<DesignerWorkQueueResponseDto> {
  const response = await httpClient.get<ApiResponse<DesignerWorkQueueResponseDto>>(
    endpoints.designerDashboard.workQueue,
    {
      params: {
        scope: query.scope ?? "mine",
        ...(query.group ? { group: query.group } : {}),
        dateRange: query.dateRange ?? "thisWeek",
        ...(query.priority ? { priority: query.priority } : {}),
        ...(query.search ? { search: query.search } : {}),
        page: query.page ?? 1,
        limit: query.limit ?? 20,
      },
    },
  );
  return response.data.data;
}

export async function getDesignerCatalogProductsApi(
  projectId: string,
  query: DesignerCatalogProductsQuery = {},
): Promise<DesignerCatalogProductListResponseDto> {
  const response = await httpClient.get<ApiResponse<DesignerCatalogProductListResponseDto>>(
    endpoints.designerCatalog.products(projectId),
    {
      params: {
        ...(query.keyword ? { keyword: query.keyword } : {}),
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query.businessTypeId != null ? { businessTypeId: query.businessTypeId } : {}),
        ...(query.versionType ? { versionType: query.versionType } : {}),
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
      },
    },
  );
  const data = response.data.data;
  return {
    items: data?.items ?? [],
    page: data?.page ?? query.page ?? 1,
    pageSize: data?.pageSize ?? query.pageSize ?? 20,
    total: data?.total ?? data?.items?.length ?? 0,
  };
}

export async function getDesignerCatalogProductApi(
  projectId: string,
  productId: string,
): Promise<DesignerCatalogProductDto> {
  const response = await httpClient.get<ApiResponse<DesignerCatalogProductDto>>(
    endpoints.designerCatalog.product(projectId, productId),
  );
  return response.data.data;
}

export async function getDesignerCatalogProductVersionApi(
  projectId: string,
  productVersionId: string,
): Promise<DesignerCatalogVersionSummaryDto> {
  const response = await httpClient.get<ApiResponse<DesignerCatalogVersionSummaryDto>>(
    endpoints.designerCatalog.productVersion(projectId, productVersionId),
  );
  return response.data.data;
}

export async function createProposalApi(
  projectId: string,
  payload: CreateProposalRequestDto,
): Promise<ProposalDto> {
  const response = await httpClient.post<ApiResponse<ProposalDto>>(endpoints.projects.proposals(projectId), {
    proposalName: payload.proposalName.trim(),
    description: payload.description?.trim() || null,
  });
  return response.data.data;
}

export async function updateProposalApi(
  proposalId: string,
  payload: UpdateProposalRequestDto,
): Promise<ProposalDto> {
  const response = await httpClient.patch<ApiResponse<ProposalDto>>(endpoints.proposals.update(proposalId), {
    proposalName: payload.proposalName.trim(),
    description: payload.description?.trim() || null,
  });
  return response.data.data;
}

export async function publishProposalApi(
  proposalId: string,
  payload: PublishProposalRequestDto = {},
): Promise<PublishProposalResponseDto> {
  const response = await httpClient.patch<ApiResponse<PublishProposalResponseDto>>(
    endpoints.proposals.publish(proposalId),
    { note: payload.note?.trim() || null },
  );
  return response.data.data;
}

export async function reopenProposalApi(proposalId: string): Promise<ReopenProposalResponseDto> {
  const response = await httpClient.post<ApiResponse<ReopenProposalResponseDto>>(
    endpoints.proposals.reopen(proposalId),
    {},
  );
  return response.data.data;
}

export async function createProposalSceneApi(
  proposalId: string,
  payload: CreateProposalSceneRequestDto,
): Promise<ProposalSceneDto> {
  const response = await httpClient.post<ApiResponse<ProposalSceneDto>>(endpoints.proposals.scenes(proposalId), {
    sceneName: payload.sceneName.trim(),
    sceneType: payload.sceneType ?? "TWO_D",
    ...(payload.sortOrder != null ? { sortOrder: payload.sortOrder } : {}),
  });
  return response.data.data;
}

export async function getProposalDetailForDesignerApi(proposalId: string): Promise<ProposalDetailDto> {
  const response = await httpClient.get<ApiResponse<ProposalDetailDto>>(endpoints.proposals.detail(proposalId));
  const data = response.data.data;
  return {
    ...data,
    items: normalizeProposalItems(data.items),
  };
}

export async function uploadScheduleMeasurementImageApi(
  input: UploadMeasurementImageInput,
): Promise<MeasurementImageUploadResponseDto> {
  // Compress/resize on device first so multipart payloads stay ~200–500KB instead of multi‑MB.
  const prepared = await prepareMeasurementImageForUpload({
    uri: input.uri,
    name: input.name,
    mimeType: input.mimeType,
  });
  const mimeType = prepared.mimeType;
  const fileName = sanitizeUploadFileName(prepared.name, mimeType);
  const formData = new FormData();
  formData.append("file", {
    uri: prepared.uri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);
  formData.append("visibility", input.visibility?.trim() || "STAFF_ONLY");
  if (input.note?.trim()) {
    formData.append("note", input.note.trim());
  }
  if (input.projectAreaId) {
    formData.append("projectAreaId", input.projectAreaId);
  }

  measurementUploadSequence += 1;
  const correlationId = `mobile-measure-${Date.now()}-${measurementUploadSequence}`;
  const token = await getAccessToken();
  const url = resolveApiUrl(endpoints.projectSchedules.measurementImages(input.scheduleId));

  // Use fetch (not axios) so RN can set multipart boundary correctly — same pattern as customer file upload.
  let response: Response;
  try {
    response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "X-Correlation-ID": correlationId,
        },
        body: formData,
      },
      MEASUREMENT_UPLOAD_TIMEOUT_MS,
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Upload timed out. Try again on a stronger connection or with fewer photos.");
    }
    throw error;
  }

  const payload = (await response.json().catch(() => null)) as
    | ApiResponse<MeasurementImageUploadResponseDto>
    | { message?: string; errorCode?: string | null; errors?: unknown }
    | null;

  if (!response.ok) {
    const errorCode =
      payload && typeof payload === "object" && "errorCode" in payload
        ? payload.errorCode
        : null;
    const message =
      (payload && typeof payload === "object" && "message" in payload && payload.message?.trim()) ||
      `Upload failed with status ${response.status}.`;
    const error = new Error(message) as Error & { errorCode?: string | null; status?: number };
    error.errorCode = errorCode;
    error.status = response.status;
    throw error;
  }

  if (payload && typeof payload === "object" && "data" in payload && payload.data) {
    return payload.data;
  }

  throw new Error("Upload succeeded but response payload was empty.");
}
