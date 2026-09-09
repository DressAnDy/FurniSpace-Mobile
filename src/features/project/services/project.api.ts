import { endpoints } from "../../../core/api/endpoints";
import { getAccessToken } from "../../../core/storage/secureStorage";
import { env } from "../../../core/config/env";
import { httpClient } from "../../../core/api/httpClient";
import { ApiResponse } from "../../../shared/types/api";
import {
  CreateProjectRequestDto,
  ProjectByUserListResponseDto,
  ProjectDetailDto,
  ProjectListItemDto,
  ProjectListQuery,
  ProjectListResponseDto,
  UploadProjectFileInput,
  UpdateProjectBasicInfoRequestDto,
  UpdateProjectStatusRequestDto,
  UpdateProjectStatusResponseDto,
  RejectProjectRequestDto,
  RejectProjectResponseDto,
  UpdateTargetCompletionDateRequestDto,
  UpdateTargetCompletionDateResponseDto,
} from "../models/project.model";
import { ReopenProjectProposalResponseDto } from "../models/project.tracking.model";
import { normalizeProjectDetailDto } from "../utils/project.mapper";

let uploadCorrelationSequence = 0;

function mapByUserItemToListItem(item: ProjectByUserListResponseDto["items"][number]): ProjectListItemDto {
  return {
    projectId: item.projectId,
    projectCode: item.projectCode,
    projectName: item.projectName,
    businessType: item.businessType,
    status: item.status,
    customerId: item.customer?.accountId ?? "",
    assignedSalesId: item.assignedSales?.accountId ?? null,
    assignedDesignerId: item.assignedDesigner?.accountId ?? null,
    submittedAt: item.submittedAt,
  };
}

export async function getProjectsApi(query: ProjectListQuery = {}): Promise<ProjectListResponseDto> {
  const response = await httpClient.get<ApiResponse<ProjectListResponseDto>>(endpoints.projects.list, {
    params: {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? { search: query.search } : {}),
      ...(query.assignedSalesId ? { assignedSalesId: query.assignedSalesId } : {}),
      ...(query.assignedDesignerId ? { assignedDesignerId: query.assignedDesignerId } : {}),
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    },
  });

  return response.data.data;
}

export async function getProjectByIdApi(projectId: string): Promise<ProjectDetailDto> {
  const response = await httpClient.get<ApiResponse<ProjectDetailDto>>(endpoints.projects.detail(projectId));
  return normalizeProjectDetailDto(response.data.data);
}

export async function getProjectsByUserApi(userId: string, query: ProjectListQuery = {}): Promise<ProjectListResponseDto> {
  const response = await httpClient.get<ApiResponse<ProjectByUserListResponseDto>>(endpoints.projects.byUser(userId), {
    params: {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? { keyword: query.search } : {}),
      page: query.page ?? 1,
      pageSize: query.limit ?? 10,
    },
  });

  const data = response.data.data;
  return {
    items: (data.items ?? []).map(mapByUserItemToListItem),
    page: data.page,
    limit: data.pageSize,
    total: data.totalItems,
  };
}

export async function createProjectApi(payload: CreateProjectRequestDto): Promise<ProjectDetailDto> {
  const response = await httpClient.post<ApiResponse<ProjectDetailDto>>(endpoints.projects.create, payload);
  return response.data.data;
}

export async function uploadCustomerProjectFileApi(
  projectId: string,
  input: UploadProjectFileInput,
): Promise<void> {
  const formData = new FormData();
  formData.append("file", {
    uri: input.uri,
    name: input.name,
    type: input.mimeType ?? "application/octet-stream",
  } as unknown as Blob);
  formData.append("fileType", input.fileType);
  formData.append("visibility", input.visibility ?? "CUSTOMER_VISIBLE");
  formData.append("isPrimary", String(input.isPrimary ?? false));
  formData.append("displayOrder", String(input.displayOrder ?? 0));
  if (input.note?.trim()) {
    formData.append("note", input.note.trim());
  }

  uploadCorrelationSequence += 1;
  const correlationId = `mobile-upload-${Date.now()}-${uploadCorrelationSequence}`;
  const token = await getAccessToken();
  let apiUrl = env.apiUrl;
  while (apiUrl.endsWith("/")) {
    apiUrl = apiUrl.slice(0, -1);
  }
  const url = `${apiUrl}${endpoints.projects.files(projectId)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-Correlation-ID": correlationId,
    },
    body: formData,
  });

  if (response.ok) {
    return;
  }

  const payload = (await response.json().catch(() => null)) as
    | { message?: string; errors?: string[] | Record<string, string[]> }
    | null;
  let details = "";
  if (Array.isArray(payload?.errors)) {
    details = payload.errors.join("\n");
  } else if (payload?.errors && typeof payload.errors === "object") {
    details = Object.values(payload.errors).flat().join("\n");
  }
  throw new Error(details || payload?.message || `Upload failed with status ${response.status}.`);
}

export async function updateProjectBasicInfoApi(
  projectId: string,
  payload: UpdateProjectBasicInfoRequestDto,
): Promise<ProjectDetailDto> {
  const response = await httpClient.patch<ApiResponse<ProjectDetailDto>>(
    endpoints.projects.updateBasicInfo(projectId),
    payload,
  );
  return response.data.data;
}

export async function updateProjectTargetCompletionDateApi(
  projectId: string,
  payload: UpdateTargetCompletionDateRequestDto,
): Promise<UpdateTargetCompletionDateResponseDto> {
  const response = await httpClient.patch<ApiResponse<UpdateTargetCompletionDateResponseDto>>(
    endpoints.projects.updateTargetDate(projectId),
    payload,
  );
  return response.data.data;
}

export async function reopenProjectProposalApi(projectId: string): Promise<ReopenProjectProposalResponseDto> {
  const response = await httpClient.post<ApiResponse<ReopenProjectProposalResponseDto>>(
    endpoints.projects.reopenProposal(projectId),
  );
  return response.data.data;
}

export async function updateProjectStatusApi(
  projectId: string,
  payload: UpdateProjectStatusRequestDto,
): Promise<UpdateProjectStatusResponseDto> {
  const response = await httpClient.patch<ApiResponse<UpdateProjectStatusResponseDto>>(
    endpoints.projects.updateStatus(projectId),
    payload,
  );
  return response.data.data;
}

export async function rejectProjectApi(
  projectId: string,
  payload: RejectProjectRequestDto,
): Promise<RejectProjectResponseDto> {
  const response = await httpClient.patch<ApiResponse<RejectProjectResponseDto>>(
    endpoints.projects.rejection(projectId),
    payload,
  );
  return response.data.data;
}
