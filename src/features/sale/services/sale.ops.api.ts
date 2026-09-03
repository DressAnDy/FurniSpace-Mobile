import { endpoints } from "../../../core/api/endpoints";
import { httpClient } from "../../../core/api/httpClient";
import { ApiResponse } from "../../../shared/types/api";
import {
  PhaseDeadlinesResponseDto,
  ProjectScheduleDto,
  ProjectScheduleListResponseDto,
} from "../../project/models/project.tracking.model";
import {
  CreateProjectScheduleRequestDto,
  MeasurementImageListResponseDto,
  ProjectAreaDto,
  ProjectAreaListResponseDto,
  ProjectFileDto,
  ProjectFileListQuery,
  ProjectFileListResponseDto,
  UpdateProjectScheduleRequestDto,
  UploadProjectFileInput,
  UpsertPhaseDeadlinesRequestDto,
  UpsertProjectAreaRequestDto,
} from "../models/sale.ops.model";

function normalizeSchedule(item: ProjectScheduleDto): ProjectScheduleDto {
  const scheduledStart = item.scheduledStart || item.scheduledAt || "";
  const scheduledEnd = item.scheduledEnd ?? item.endAt ?? null;
  return {
    ...item,
    scheduledStart,
    scheduledEnd,
    scheduledAt: scheduledStart,
    endAt: scheduledEnd,
  };
}

function unwrapList<T>(data: { items?: T[] } | T[] | null | undefined): T[] {
  if (!data) {
    return [];
  }
  if (Array.isArray(data)) {
    return data;
  }
  return data.items ?? [];
}

export async function putProjectPhaseDeadlinesApi(
  projectId: string,
  payload: UpsertPhaseDeadlinesRequestDto,
): Promise<PhaseDeadlinesResponseDto> {
  const response = await httpClient.put<ApiResponse<PhaseDeadlinesResponseDto>>(
    endpoints.projects.updatePhaseDeadlines(projectId),
    payload,
  );
  return response.data.data;
}

export async function getProjectAreasApi(
  projectId: string,
  includeCancelled = false,
): Promise<ProjectAreaDto[]> {
  const response = await httpClient.get<ApiResponse<ProjectAreaListResponseDto | ProjectAreaDto[]>>(
    endpoints.projects.areas(projectId),
    { params: { includeCancelled } },
  );
  return unwrapList(response.data.data);
}

export async function createProjectAreaApi(
  projectId: string,
  payload: UpsertProjectAreaRequestDto,
): Promise<ProjectAreaDto> {
  const response = await httpClient.post<ApiResponse<ProjectAreaDto>>(endpoints.projects.areas(projectId), payload);
  return response.data.data;
}

export async function getProjectAreaByIdApi(areaId: string): Promise<ProjectAreaDto> {
  const response = await httpClient.get<ApiResponse<ProjectAreaDto>>(endpoints.projectAreas.detail(areaId));
  return response.data.data;
}

export async function updateProjectAreaApi(
  areaId: string,
  payload: UpsertProjectAreaRequestDto,
): Promise<ProjectAreaDto> {
  const response = await httpClient.patch<ApiResponse<ProjectAreaDto>>(endpoints.projectAreas.update(areaId), payload);
  return response.data.data;
}

export async function cancelProjectAreaApi(areaId: string): Promise<ProjectAreaDto> {
  const response = await httpClient.patch<ApiResponse<ProjectAreaDto>>(endpoints.projectAreas.cancel(areaId), {});
  return response.data.data;
}

export async function createProjectScheduleApi(
  projectId: string,
  payload: CreateProjectScheduleRequestDto,
): Promise<ProjectScheduleDto> {
  const response = await httpClient.post<ApiResponse<ProjectScheduleDto>>(
    endpoints.projects.schedules(projectId),
    payload,
  );
  return normalizeSchedule(response.data.data);
}

export async function updateProjectScheduleApi(
  scheduleId: string,
  payload: UpdateProjectScheduleRequestDto,
): Promise<ProjectScheduleDto> {
  const response = await httpClient.patch<ApiResponse<ProjectScheduleDto>>(
    endpoints.projectSchedules.update(scheduleId),
    payload,
  );
  return normalizeSchedule(response.data.data);
}

export async function deleteProjectScheduleApi(scheduleId: string): Promise<void> {
  await httpClient.delete<ApiResponse<null>>(endpoints.projectSchedules.delete(scheduleId));
}

export async function getMyAssignedSchedulesApi(query: {
  projectId?: string;
  scheduleType?: string;
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<ProjectScheduleDto[]> {
  const response = await httpClient.get<ApiResponse<ProjectScheduleListResponseDto>>(
    endpoints.projectSchedules.myAssigned,
    { params: query },
  );
  return unwrapList(response.data.data).map(normalizeSchedule);
}

export async function getProjectFilesApi(
  projectId: string,
  query: ProjectFileListQuery = {},
): Promise<ProjectFileListResponseDto> {
  const response = await httpClient.get<ApiResponse<ProjectFileListResponseDto | ProjectFileDto[]>>(
    endpoints.projects.files(projectId),
    {
      params: {
        ...(query.fileType ? { fileType: query.fileType } : {}),
        ...(query.visibility ? { visibility: query.visibility } : {}),
        page: query.page ?? 1,
        limit: query.limit ?? 20,
      },
    },
  );
  const data = response.data.data;
  if (Array.isArray(data)) {
    return { items: data, page: 1, limit: data.length, total: data.length };
  }
  return {
    items: data.items ?? [],
    page: data.page ?? 1,
    limit: data.limit ?? 20,
    total: data.total ?? data.items?.length ?? 0,
  };
}

export async function searchProjectFilesApi(
  projectId: string,
  q: string,
  page = 1,
  limit = 20,
): Promise<ProjectFileListResponseDto> {
  const response = await httpClient.get<ApiResponse<ProjectFileListResponseDto | ProjectFileDto[]>>(
    endpoints.projects.searchFiles(projectId),
    { params: { q, page, limit } },
  );
  const data = response.data.data;
  if (Array.isArray(data)) {
    return { items: data, page, limit, total: data.length };
  }
  return {
    items: data.items ?? [],
    page: data.page ?? page,
    limit: data.limit ?? limit,
    total: data.total ?? data.items?.length ?? 0,
  };
}

export async function uploadProjectFileApi(
  projectId: string,
  input: UploadProjectFileInput,
): Promise<ProjectFileDto> {
  const formData = new FormData();
  formData.append("file", {
    uri: input.uri,
    name: input.name,
    type: input.type,
  } as unknown as Blob);
  formData.append("fileType", input.fileType ?? "OTHER");
  formData.append("visibility", input.visibility ?? "STAFF_ONLY");
  if (input.note?.trim()) {
    formData.append("note", input.note.trim());
  }

  const response = await httpClient.post<ApiResponse<ProjectFileDto>>(endpoints.projects.files(projectId), formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
}

export async function getScheduleMeasurementImagesApi(scheduleId: string): Promise<MeasurementImageListResponseDto> {
  const response = await httpClient.get<ApiResponse<MeasurementImageListResponseDto>>(
    endpoints.projectSchedules.measurementImages(scheduleId),
  );
  const data = response.data.data;
  return {
    items: unwrapList(data),
    page: data.page ?? 1,
    limit: data.limit ?? 20,
    total: data.total ?? unwrapList(data).length,
  };
}

export async function getAreaMeasurementImagesApi(
  areaId: string,
  page = 1,
  limit = 20,
): Promise<MeasurementImageListResponseDto> {
  const response = await httpClient.get<ApiResponse<MeasurementImageListResponseDto>>(
    endpoints.projectAreas.measurementImages(areaId),
    { params: { page, limit } },
  );
  const data = response.data.data;
  return {
    items: unwrapList(data),
    page: data.page ?? page,
    limit: data.limit ?? limit,
    total: data.total ?? unwrapList(data).length,
  };
}

export async function linkAreaMeasurementImageApi(areaId: string, fileId: string): Promise<void> {
  await httpClient.post<ApiResponse<null>>(endpoints.projectAreas.linkMeasurementImage(areaId, fileId), {});
}

export async function unlinkAreaMeasurementImageApi(areaId: string, fileId: string): Promise<void> {
  await httpClient.delete<ApiResponse<null>>(endpoints.projectAreas.unlinkMeasurementImage(areaId, fileId));
}
