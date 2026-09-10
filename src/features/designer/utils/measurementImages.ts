import { AxiosError } from "axios";
import { AppError } from "../../../core/errors/AppError";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import { mapAxiosError } from "../../../core/errors/errorMapper";

const ELIGIBLE_SCHEDULE_STATUSES = new Set(["CONFIRMED", "MEASUREMENT_CONFIRMED"]);
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

const MEASUREMENT_ERROR_MESSAGES: Record<string, string> = {
  MEASUREMENT_IMAGE_SCHEDULE_NOT_ELIGIBLE: "This measurement schedule is not eligible for photo upload.",
  MEASUREMENT_IMAGE_CAPTURE_BEFORE_START: "Photos can only be uploaded after the schedule start time.",
  MEASUREMENT_IMAGE_INVALID_FILE_METADATA: "Invalid image file metadata.",
  MEASUREMENT_IMAGE_STORAGE_PATH_INVALID: "Unable to store this image path.",
  MEASUREMENT_IMAGE_STORAGE_PATH_DUPLICATE: "This photo was already uploaded.",
  MEASUREMENT_IMAGE_NOT_FOUND: "Measurement photo not found.",
  MEASUREMENT_IMAGE_AREA_LINK_EXISTS: "This photo is already linked to that area.",
  MEASUREMENT_IMAGE_AREA_LINK_NOT_FOUND: "This photo is not linked to that area.",
  MEASUREMENT_IMAGE_SCHEDULE_PROJECT_MISMATCH: "Schedule, area, and project do not match.",
};

export function isEligibleMeasurementScheduleStatus(status: string | null | undefined): boolean {
  return Boolean(status && ELIGIBLE_SCHEDULE_STATUSES.has(status));
}

export function isAllowedMeasurementMimeType(mimeType: string | null | undefined): boolean {
  if (!mimeType) {
    return true;
  }
  return ALLOWED_MIME_TYPES.has(mimeType.toLowerCase());
}

export function normalizeMeasurementMimeType(mimeType: string | null | undefined, fileName?: string): string {
  if (mimeType && isAllowedMeasurementMimeType(mimeType)) {
    return mimeType.toLowerCase() === "image/jpg" ? "image/jpeg" : mimeType.toLowerCase();
  }
  const lower = (fileName ?? "").toLowerCase();
  if (lower.endsWith(".png")) {
    return "image/png";
  }
  if (lower.endsWith(".webp")) {
    return "image/webp";
  }
  return "image/jpeg";
}

export function getMeasurementImageErrorMessage(error: unknown, fallback = "Unable to upload photo."): string {
  if (error && typeof error === "object" && "errorCode" in error) {
    const code = String((error as { errorCode?: string | null }).errorCode ?? "").trim();
    if (code && MEASUREMENT_ERROR_MESSAGES[code]) {
      return MEASUREMENT_ERROR_MESSAGES[code];
    }
  }

  if (error instanceof AxiosError) {
    const payload = error.response?.data as { errorCode?: string | null; message?: string } | undefined;
    const code = payload?.errorCode?.trim();
    if (code && MEASUREMENT_ERROR_MESSAGES[code]) {
      return MEASUREMENT_ERROR_MESSAGES[code];
    }
    return mapAxiosError(error).message || fallback;
  }

  if (error instanceof AppError) {
    return error.message || fallback;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return getErrorMessage(error, fallback);
}
