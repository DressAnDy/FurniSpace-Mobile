import type { PhaseDeadlinesResponseDto, ProjectScheduleDto, ProjectScheduleType } from "../../project/models/project.tracking.model";

export type UpsertPhaseDeadlinesRequestDto = {
  proposalDueDate: string;
  productionDueDate: string;
};

export type ProjectAreaType = "STORE" | "FLOOR" | "ROOM" | "ZONE" | "OUTDOOR_AREA" | "OTHER" | string;

export type ProjectAreaStatus = "DRAFT" | "ACTIVE" | "CANCELLED" | string;

export type ProjectAreaDto = {
  projectAreaId: string;
  projectId: string;
  parentAreaId?: string | null;
  areaName: string;
  areaType: ProjectAreaType;
  floorNumber?: number | null;
  description?: string | null;
  areaSqm?: number | null;
  width?: number | null;
  length?: number | null;
  height?: number | null;
  currentCondition?: string | null;
  requirementNote?: string | null;
  status: ProjectAreaStatus;
  createdAt?: string;
  updatedAt?: string;
  cancelledAt?: string | null;
};

export type UpsertProjectAreaRequestDto = {
  parentAreaId?: string | null;
  areaName: string;
  areaType: ProjectAreaType;
  floorNumber?: number | null;
  description?: string | null;
  areaSqm?: number | null;
  width?: number | null;
  length?: number | null;
  height?: number | null;
  currentCondition?: string | null;
  requirementNote?: string | null;
  status?: ProjectAreaStatus;
};

export type ProjectAreaListResponseDto = {
  items: ProjectAreaDto[];
  page?: number;
  limit?: number;
  total?: number;
};

export type CreateProjectScheduleRequestDto = {
  scheduleType: ProjectScheduleType;
  title: string;
  description?: string | null;
  assignedStaffId?: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  location?: string | null;
  customerNote?: string | null;
  internalNote?: string | null;
};

export type UpdateProjectScheduleRequestDto = Partial<CreateProjectScheduleRequestDto>;

export type ProjectFileVisibility = "CUSTOMER_VISIBLE" | "STAFF_ONLY" | "PRIVATE" | string;

export type ProjectFileType = "MEASUREMENT_REPORT" | "FLOOR_PLAN" | "REFERENCE" | "OTHER" | string;

export type ProjectFileDto = {
  fileId: string;
  fileLinkId?: string;
  projectId: string;
  originalFileName: string;
  fileName?: string;
  fileType: ProjectFileType;
  mimeType?: string;
  fileSize?: number;
  storagePath?: string;
  publicUrl?: string | null;
  visibility: ProjectFileVisibility;
  uploadedBy?: string;
  uploadedAt?: string;
  note?: string | null;
};

export type ProjectFileListResponseDto = {
  items: ProjectFileDto[];
  page?: number;
  limit?: number;
  total?: number;
};

export type ProjectFileListQuery = {
  fileType?: string;
  visibility?: string;
  page?: number;
  limit?: number;
};

export type UploadProjectFileInput = {
  uri: string;
  name: string;
  type: string;
  fileType?: ProjectFileType;
  visibility?: ProjectFileVisibility;
  note?: string;
};

export type MeasurementImageDto = {
  fileId: string;
  scheduleId?: string | null;
  projectAreaId?: string | null;
  publicUrl?: string | null;
  originalFileName?: string;
  uploadedAt?: string;
};

export type MeasurementImageListResponseDto = {
  items: MeasurementImageDto[];
  page?: number;
  limit?: number;
  total?: number;
};

export type ProjectMeasurementImageScheduleDto = {
  scheduleId: string;
  scheduledStart: string;
};

export type ProjectMeasurementImageAreaDto = {
  projectAreaId: string;
  areaName: string;
};

export type ProjectMeasurementImageDto = {
  fileId: string;
  url: string;
  uploadedAt: string;
  measurementSchedule: ProjectMeasurementImageScheduleDto | null;
  areas: ProjectMeasurementImageAreaDto[];
};

export type ProjectMeasurementImagesQuery = {
  scheduleId?: string;
  projectAreaId?: string;
  assigned?: boolean;
  page?: number;
  limit?: number;
};

export type ProjectMeasurementImagesResponseDto = {
  items: ProjectMeasurementImageDto[];
  page: number;
  limit: number;
  total: number;
};

export type { PhaseDeadlinesResponseDto, ProjectScheduleDto };
