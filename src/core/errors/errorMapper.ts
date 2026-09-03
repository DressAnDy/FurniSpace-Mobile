import { AxiosError } from "axios";
import { AppError } from "./AppError";

type BackendErrorPayload = {
  message?: string;
  errorCode?: string | null;
  errors?: Array<{ message?: string; field?: string } | string> | Record<string, string[] | string> | null;
};

function extractBackendErrorMessage(payload: BackendErrorPayload | undefined, fallback: string): string {
  if (!payload) {
    return fallback;
  }

  const detailMessages: string[] = [];

  if (payload.errors) {
    if (Array.isArray(payload.errors)) {
      for (const item of payload.errors) {
        if (typeof item === "string" && item.trim()) {
          detailMessages.push(item.trim());
        } else if (item && typeof item === "object" && item.message?.trim()) {
          detailMessages.push(item.message.trim());
        }
      }
    } else if (typeof payload.errors === "object") {
      for (const [field, messages] of Object.entries(payload.errors)) {
        const values = Array.isArray(messages) ? messages : [messages];
        for (const message of values) {
          if (typeof message === "string" && message.trim()) {
            detailMessages.push(`${field}: ${message.trim()}`);
          }
        }
      }
    }
  }

  if (detailMessages.length > 0) {
    const summary = payload.message?.trim();
    if (summary && summary.toLowerCase() !== "validation failed") {
      return `${summary}\n${detailMessages.join("\n")}`;
    }
    return detailMessages.join("\n");
  }

  return payload.message?.trim() || fallback;
}

export function mapAxiosError(error: unknown): AppError {
  if (!(error instanceof AxiosError)) {
    return new AppError("Unexpected error occurred.", "UNKNOWN_ERROR");
  }

  const status = error.response?.status;
  const payload = error.response?.data as BackendErrorPayload | undefined;
  const message = extractBackendErrorMessage(payload, error.message);

  if (!status) {
    return new AppError("Network error. Please check your connection.", "NETWORK_ERROR");
  }

  if (status === 401) {
    return new AppError(message || "Unauthorized.", "UNAUTHORIZED", status);
  }

  if (status === 403) {
    return new AppError(message || "Forbidden.", "FORBIDDEN", status);
  }

  if (status === 400 || status === 422) {
    return new AppError(message || "Validation error.", "VALIDATION_ERROR", status);
  }

  if (status === 409) {
    return new AppError(message || "Conflict error.", "CONFLICT", status);
  }

  if (status === 429) {
    return new AppError(message || "Too many requests. Please try again later.", "RATE_LIMITED", status);
  }

  if (status >= 500) {
    return new AppError("Server error. Please try again later.", "SERVER_ERROR", status);
  }

  return new AppError(message || "Unexpected error occurred.", "UNKNOWN_ERROR", status);
}
