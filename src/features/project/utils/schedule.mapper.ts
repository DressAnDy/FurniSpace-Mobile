import { ProjectScheduleDto, ProjectScheduleStatus, ProjectScheduleType } from "../models/project.tracking.model";
import { readRecord } from "./amount.mapper";

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeScheduleStatus(value: unknown): ProjectScheduleStatus {
  if (typeof value !== "string" || !value.trim()) {
    return "PENDING_CONFIRMATION";
  }

  return value.trim().replace(/\s+/g, "_").toUpperCase() as ProjectScheduleStatus;
}

function normalizeScheduleType(value: unknown): ProjectScheduleType {
  if (typeof value !== "string" || !value.trim()) {
    return "OTHER";
  }

  return value.trim().replace(/\s+/g, "_").toUpperCase() as ProjectScheduleType;
}

export function normalizeProjectSchedule(raw: unknown): ProjectScheduleDto | null {
  const record = readRecord(raw);
  if (!record) {
    return null;
  }

  return {
    scheduleId: readString(record.scheduleId) ?? readString(record.ScheduleId) ?? "",
    projectId: readString(record.projectId) ?? readString(record.ProjectId) ?? "",
    scheduleType: normalizeScheduleType(record.scheduleType ?? record.ScheduleType),
    title: readString(record.title) ?? readString(record.Title) ?? null,
    description: readString(record.description) ?? readString(record.Description) ?? null,
    scheduledAt:
      readString(record.scheduledStart) ??
      readString(record.ScheduledStart) ??
      readString(record.scheduledAt) ??
      readString(record.ScheduledAt) ??
      readString(record.startAt) ??
      readString(record.StartAt) ??
      readString(record.startDate) ??
      readString(record.StartDate) ??
      readString(record.startDateTime) ??
      readString(record.StartDateTime) ??
      "",
    endAt:
      readString(record.scheduledEnd) ??
      readString(record.ScheduledEnd) ??
      readString(record.endAt) ??
      readString(record.EndAt) ??
      readString(record.endDate) ??
      readString(record.EndDate) ??
      readString(record.endDateTime) ??
      readString(record.EndDateTime) ??
      null,
    location: readString(record.location) ?? readString(record.Location) ?? null,
    projectCode: readString(record.projectCode) ?? readString(record.ProjectCode) ?? null,
    projectName: readString(record.projectName) ?? readString(record.ProjectName) ?? null,
    status: normalizeScheduleStatus(record.status ?? record.Status),
    createdAt: readString(record.createdAt) ?? readString(record.CreatedAt),
    updatedAt: readString(record.updatedAt) ?? readString(record.UpdatedAt),
  };
}

export function isSchedulePendingConfirmation(status: ProjectScheduleStatus | string): boolean {
  return normalizeScheduleStatus(status) === "PENDING_CONFIRMATION";
}

export function formatScheduleTypeLabel(type: ProjectScheduleType | string): string {
  return type.replaceAll("_", " ");
}

export function formatScheduleStatusLabel(status: ProjectScheduleStatus | string): string {
  return normalizeScheduleStatus(status).replaceAll("_", " ");
}
