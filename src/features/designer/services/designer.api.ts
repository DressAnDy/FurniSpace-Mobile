import { endpoints } from "../../../core/api/endpoints";
import { httpClient } from "../../../core/api/httpClient";
import { directUploadFile } from "../../../core/upload/directUpload";
import { ApiResponse } from "../../../shared/types/api";
import { unwrapPagedList, type PagedList } from "../../../shared/utils/pagedList";
import {
  CreateProposalRequestDto,
  CreateProposalSceneRequestDto,
  DesignerCatalogProductDto,
  DesignerCatalogProductListResponseDto,
  DesignerCatalogProductsQuery,
  DesignerAssignedProjectItemDto,
  DesignerCatalogVersionSummaryDto,
  DesignerConfirmedMeasurementItemDto,
  DesignerKpiListQuery,
  DesignerKpisDto,
  DesignerKpisQuery,
  DesignerProposalConsultingItemDto,
  DesignerRevisionRequestedItemDto,
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
import { prepareMeasurementImageForUpload } from "../utils/measurementImages";

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

export async function getDesignerKpisApi(query: DesignerKpisQuery = {}): Promise<DesignerKpisDto> {
  const response = await httpClient.get<ApiResponse<DesignerKpisDto>>(endpoints.designerDashboard.kpis, {
    params: {
      scope: query.scope ?? "mine",
      ...(query.dateRange ? { dateRange: query.dateRange } : {}),
      ...(query.search ? { search: query.search } : {}),
    },
  });
  return response.data.data ?? {};
}

function designerKpiListParams(query: DesignerKpiListQuery, includeDateRange: boolean) {
  return {
    scope: query.scope ?? "mine",
    ...(includeDateRange && query.dateRange ? { dateRange: query.dateRange } : {}),
    page: query.page ?? 1,
    limit: query.limit ?? 5,
  };
}

export async function getDesignerConfirmedMeasurementsApi(
  query: DesignerKpiListQuery = {},
): Promise<PagedList<DesignerConfirmedMeasurementItemDto>> {
  const response = await httpClient.get<ApiResponse<unknown>>(endpoints.designerDashboard.confirmedMeasurements, {
    params: designerKpiListParams(query, true),
  });
  return unwrapPagedList<DesignerConfirmedMeasurementItemDto>(response.data.data);
}

export async function getDesignerProposalConsultingApi(
  query: DesignerKpiListQuery = {},
): Promise<PagedList<DesignerProposalConsultingItemDto>> {
  const response = await httpClient.get<ApiResponse<unknown>>(endpoints.designerDashboard.proposalConsulting, {
    params: designerKpiListParams(query, true),
  });
  return unwrapPagedList<DesignerProposalConsultingItemDto>(response.data.data);
}

export async function getDesignerRevisionRequestedApi(
  query: DesignerKpiListQuery = {},
): Promise<PagedList<DesignerRevisionRequestedItemDto>> {
  const response = await httpClient.get<ApiResponse<unknown>>(endpoints.designerDashboard.revisionRequested, {
    params: designerKpiListParams(query, true),
  });
  return unwrapPagedList<DesignerRevisionRequestedItemDto>(response.data.data);
}

export async function getDesignerAssignedProjectsKpiApi(
  query: DesignerKpiListQuery = {},
): Promise<PagedList<DesignerAssignedProjectItemDto>> {
  const response = await httpClient.get<ApiResponse<unknown>>(endpoints.designerDashboard.assignedProjects, {
    params: designerKpiListParams(query, false),
  });
  return unwrapPagedList<DesignerAssignedProjectItemDto>(response.data.data);
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
  // Compress/resize on device first so the signed upload stays a few hundred KB.
  const prepared = await prepareMeasurementImageForUpload({
    uri: input.uri,
    name: input.name,
    mimeType: input.mimeType,
  });
  const mimeType = prepared.mimeType;
  const fileName = sanitizeUploadFileName(prepared.name, mimeType);
  return directUploadFile<MeasurementImageUploadResponseDto>({
    preparePath: endpoints.projectSchedules.measurementImageUploadUrl(input.scheduleId),
    completePath: endpoints.projectSchedules.measurementImageComplete(input.scheduleId),
    file: {
      uri: prepared.uri,
      name: fileName,
      mimeType,
    },
    prepareBody: {
      visibility: input.visibility?.trim() || "STAFF_ONLY",
      note: input.note?.trim(),
      projectAreaId: input.projectAreaId || undefined,
    },
  });
}
