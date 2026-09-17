import axios from "axios";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import { httpClient } from "../api/httpClient";
import { ApiResponse } from "../../shared/types/api";
import { ensureReadableUploadUri } from "./readableFile";

export type DirectUploadFile = {
  uri: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
};

type PrepareUploadResponse = {
  fileId: string;
  uploadUrl: string;
  contentType: string;
  expiresAt?: string;
};

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  zip: "application/zip",
  glb: "model/gltf-binary",
  gltf: "model/gltf+json",
};

const RETRY_PUT_CODES = new Set([
  "FILE_UPLOAD_OBJECT_MISSING",
  "PROJECT_FILE_UPLOAD_OBJECT_MISSING",
]);

const UPLOAD_ERROR_MESSAGES: Record<string, string> = {
  FILE_UPLOAD_NOT_FOUND: "This upload expired. Please try again.",
  PROJECT_FILE_UPLOAD_NOT_FOUND: "This upload expired. Please try again.",
  FILE_UPLOAD_NOT_PENDING: "This file was already processed. Refresh and try again if it is missing.",
  PROJECT_FILE_UPLOAD_NOT_PENDING: "This file was already processed. Refresh and try again if it is missing.",
  FILE_UPLOAD_FORBIDDEN: "You do not have permission to finish this upload.",
  PROJECT_FILE_UPLOAD_FORBIDDEN: "You do not have permission to finish this upload.",
  FILE_UPLOAD_OBJECT_MISSING: "The file did not reach storage. Please try again.",
  PROJECT_FILE_UPLOAD_OBJECT_MISSING: "The file did not reach storage. Please try again.",
  FILE_UPLOAD_SIZE_MISMATCH: "The uploaded file size did not match. Please try again.",
  PROJECT_FILE_UPLOAD_SIZE_MISMATCH: "The uploaded file size did not match. Please try again.",
  FILE_UPLOAD_CONTENT_TYPE_MISMATCH: "The file type did not match. Please try a different file.",
  PROJECT_FILE_UPLOAD_CONTENT_TYPE_MISMATCH: "The file type did not match. Please try a different file.",
};

export function resolveUploadContentType(fileName: string, mimeType?: string | null): string {
  const normalized = mimeType?.trim().toLowerCase() ?? "";
  if (normalized === "image/jpg") {
    return "image/jpeg";
  }
  if (normalized && normalized !== "application/octet-stream") {
    return normalized;
  }

  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[extension] ?? "application/octet-stream";
}

function readRecordString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function omitEmpty(body: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

async function resolveFileSize(file: DirectUploadFile): Promise<number> {
  if (typeof file.size === "number" && Number.isFinite(file.size) && file.size > 0) {
    return file.size;
  }

  if (Platform.OS === "web") {
    const response = await fetch(file.uri);
    const blob = await response.blob();
    return blob.size;
  }

  const info = await FileSystem.getInfoAsync(file.uri);
  if (info.exists && !info.isDirectory && typeof info.size === "number" && info.size > 0) {
    return info.size;
  }

  return 0;
}

async function putRawFile(uri: string, uploadUrl: string, contentType: string): Promise<void> {
  if (Platform.OS === "web") {
    const local = await fetch(uri);
    const blob = await local.blob();
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });
    if (!response.ok) {
      throw uploadError(`Storage rejected the upload (${response.status}).`, response.status);
    }
    return;
  }

  try {
    const result = await FileSystem.uploadAsync(uploadUrl, uri, {
      httpMethod: "PUT",
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: { "Content-Type": contentType },
    });

    if (result.status < 200 || result.status >= 300) {
      throw uploadError(`Storage rejected the upload (${result.status}).`, result.status);
    }
  } catch (error) {
    if (error instanceof Error && "status" in error && typeof error.status === "number") {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    if (/isn't readable|uploadAsync/i.test(message)) {
      throw uploadError("Could not read the selected file. Please choose it again.");
    }
    throw error instanceof Error ? error : uploadError("Upload failed.");
  }
}

function uploadError(message: string, status?: number, errorCode?: string): Error {
  const error = new Error(message) as Error & { status?: number; errorCode?: string };
  error.status = status;
  error.errorCode = errorCode;
  return error;
}

function readAxiosFailure(error: unknown): { message: string; status?: number; errorCode?: string } {
  if (!axios.isAxiosError(error)) {
    return { message: error instanceof Error ? error.message : "Upload failed." };
  }

  const payload = error.response?.data as { message?: string; errorCode?: string | null } | undefined;
  return {
    message: payload?.message?.trim() || error.message,
    status: error.response?.status,
    errorCode: payload?.errorCode ?? undefined,
  };
}

function toUploadError(error: unknown): Error {
  const failure = readAxiosFailure(error);
  if (failure.status === 413) {
    return uploadError("This file is too large.", 413, failure.errorCode);
  }
  if (failure.status === 415) {
    return uploadError("This file type is not supported.", 415, failure.errorCode);
  }
  const message = (failure.errorCode && UPLOAD_ERROR_MESSAGES[failure.errorCode]) || failure.message;
  return uploadError(message, failure.status, failure.errorCode);
}

function isSignedUrlFresh(expiresAt?: string): boolean {
  if (!expiresAt) {
    return true;
  }
  const expires = Date.parse(expiresAt);
  return Number.isNaN(expires) || expires > Date.now() + 15_000;
}

export async function directUploadFile<TComplete>(options: {
  preparePath: string;
  completePath: string;
  file: DirectUploadFile;
  prepareBody?: Record<string, unknown>;
  completeBody?: Record<string, unknown>;
}): Promise<TComplete> {
  const localUri = await ensureReadableUploadUri(options.file.uri, options.file.name);
  const file: DirectUploadFile = { ...options.file, uri: localUri };
  const contentType = resolveUploadContentType(file.name, file.mimeType);
  const fileSizeBytes = await resolveFileSize(file);
  if (fileSizeBytes <= 0) {
    throw uploadError("Could not read the selected file. Please choose it again.");
  }

  let preparedResponse;
  try {
    preparedResponse = await httpClient.post<ApiResponse<PrepareUploadResponse>>(
      options.preparePath,
      omitEmpty({
        originalFileName: file.name.trim() || "upload.bin",
        contentType,
        fileSizeBytes,
        ...(options.prepareBody ?? {}),
      }),
    );
  } catch (error) {
    throw toUploadError(error);
  }
  const preparedRaw = (preparedResponse.data.data ?? {}) as unknown as Record<string, unknown>;
  const prepared: PrepareUploadResponse = {
    fileId: readRecordString(preparedRaw, "fileId", "FileId"),
    uploadUrl: readRecordString(preparedRaw, "uploadUrl", "UploadUrl"),
    contentType: readRecordString(preparedRaw, "contentType", "ContentType") || contentType,
    expiresAt: readRecordString(preparedRaw, "expiresAt", "ExpiresAt") || undefined,
  };

  if (!prepared.fileId || !prepared.uploadUrl) {
    throw uploadError("Upload could not be started. Please try again.");
  }

  const complete = async () => {
    const response = await httpClient.post<ApiResponse<TComplete>>(
      options.completePath,
      omitEmpty({
        fileId: prepared.fileId,
        ...(options.completeBody ?? {}),
      }),
    );
    return response.data.data;
  };

  try {
    await putRawFile(file.uri, prepared.uploadUrl, prepared.contentType);
    return await complete();
  } catch (error) {
    const failure = readAxiosFailure(error);
    const canRetryPut =
      Boolean(failure.errorCode && RETRY_PUT_CODES.has(failure.errorCode)) && isSignedUrlFresh(prepared.expiresAt);

    if (!canRetryPut) {
      throw error instanceof Error && !axios.isAxiosError(error) ? error : toUploadError(error);
    }

    await putRawFile(file.uri, prepared.uploadUrl, prepared.contentType);
    try {
      return await complete();
    } catch (retryError) {
      throw toUploadError(retryError);
    }
  }
}
