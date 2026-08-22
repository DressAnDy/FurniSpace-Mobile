import { AxiosError } from "axios";
import { ApiResponse } from "../../shared/types/api";

export function getBackendErrorCode(error: unknown): string | null {
  if (!(error instanceof AxiosError)) {
    return null;
  }

  const payload = error.response?.data as Partial<ApiResponse<unknown>> | undefined;
  const code = payload?.errorCode;

  if (typeof code === "string" && code.trim()) {
    return code.trim();
  }

  return null;
}
