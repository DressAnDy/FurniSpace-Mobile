import { endpoints } from "../../../core/api/endpoints";
import { authHttpClient } from "../../../core/api/httpClient";
import { ApiResponse } from "../../../shared/types/api";
import { LoginRequestDto, LoginResponseDto } from "../models/auth.model";

export async function loginApi(payload: LoginRequestDto): Promise<LoginResponseDto> {
  const response = await authHttpClient.post<ApiResponse<LoginResponseDto>>(endpoints.auth.login, payload);
  return response.data.data;
}
