export type AppErrorCode =
  | "NETWORK_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "SERVER_ERROR"
  | "UNKNOWN_ERROR";

export class AppError extends Error {
  code: AppErrorCode;
  status?: number;

  constructor(message: string, code: AppErrorCode, status?: number) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}
