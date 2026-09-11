import { AxiosError } from "axios";
import * as ImageManipulator from "expo-image-manipulator";
import { Image } from "react-native";
import { AppError } from "../../../core/errors/AppError";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import { mapAxiosError } from "../../../core/errors/errorMapper";

const ELIGIBLE_SCHEDULE_STATUSES = new Set(["CONFIRMED", "MEASUREMENT_CONFIRMED"]);
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

/** Keep measurement uploads small enough for mobile networks without losing site detail. */
const MEASUREMENT_MAX_EDGE = 1600;
const MEASUREMENT_JPEG_QUALITY = 0.62;
export const MEASUREMENT_UPLOAD_CONCURRENCY = 2;
export const MEASUREMENT_UPLOAD_TIMEOUT_MS = 90_000;

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

export type PreparedMeasurementFile = {
  uri: string;
  name: string;
  mimeType: string;
};

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error),
    );
  });
}

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

/**
 * Resize longest edge + JPEG-compress before multipart upload.
 * Falls back to the original URI if manipulation fails (still uploadable).
 */
export async function prepareMeasurementImageForUpload(input: {
  uri: string;
  name: string;
  mimeType?: string | null;
}): Promise<PreparedMeasurementFile> {
  const safeNameBase = (input.name.trim() || `measurement-${Date.now()}`).replace(/\.[^.]+$/, "");
  try {
    let actions: ImageManipulator.Action[] = [];
    try {
      const { width, height } = await getImageSize(input.uri);
      const longest = Math.max(width, height);
      if (longest > MEASUREMENT_MAX_EDGE) {
        actions =
          width >= height
            ? [{ resize: { width: MEASUREMENT_MAX_EDGE } }]
            : [{ resize: { height: MEASUREMENT_MAX_EDGE } }];
      }
    } catch {
      // Unknown size — still force a bounded width so huge camera files shrink.
      actions = [{ resize: { width: MEASUREMENT_MAX_EDGE } }];
    }

    const result = await ImageManipulator.manipulateAsync(input.uri, actions, {
      compress: MEASUREMENT_JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return {
      uri: result.uri,
      name: `${safeNameBase}.jpg`,
      mimeType: "image/jpeg",
    };
  } catch {
    return {
      uri: input.uri,
      name: input.name,
      mimeType: normalizeMeasurementMimeType(input.mimeType, input.name),
    };
  }
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let nextIndex = 0;
  let completed = 0;

  const runWorker = async () => {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      try {
        const value = await worker(items[current], current);
        results[current] = { status: "fulfilled", value };
      } catch (reason) {
        results[current] = { status: "rejected", reason };
      }
      completed += 1;
      onProgress?.(completed, items.length);
    }
  };

  const pool = Array.from({ length: Math.min(concurrency, Math.max(items.length, 1)) }, () => runWorker());
  await Promise.all(pool);
  return results;
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
