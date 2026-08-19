import { AppError } from "./AppError";
import { mapAxiosError } from "./errorMapper";

export function getErrorMessage(error: unknown, fallback = "Unexpected error occurred."): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error && error.message && !error.message.startsWith("Request failed with status code")) {
    return error.message;
  }

  return mapAxiosError(error).message || fallback;
}
