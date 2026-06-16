import { AxiosError } from "axios";
import { AppError } from "./AppError";

type BackendErrorPayload = {
  message?: string;
};

export function mapAxiosError(error: unknown): AppError {
  if (!(error instanceof AxiosError)) {
    return new AppError("Unexpected error occurred.", "UNKNOWN_ERROR");
  }

  const status = error.response?.status;
  const payload = error.response?.data as BackendErrorPayload | undefined;
  const message = payload?.message ?? error.message;

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

  if (status >= 500) {
    return new AppError("Server error. Please try again later.", "SERVER_ERROR", status);
  }

  return new AppError(message || "Unexpected error occurred.", "UNKNOWN_ERROR", status);
}
