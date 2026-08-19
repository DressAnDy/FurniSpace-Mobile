export type ApiResponse<T> = {
  status: number;
  message: string;
  data: T;
  errors: unknown[] | null;
  errorCode: string | null;
};
