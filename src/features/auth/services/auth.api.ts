import { AppError } from "../../../core/errors/AppError";
import { extractAuthTokensFromSetCookie } from "../../../core/api/authCookies";
import { endpoints } from "../../../core/api/endpoints";
import { postAuthJson, postAuthJsonWithBearer } from "../../../core/api/authTransport";
import { authHttpClient } from "../../../core/api/httpClient";
import { getAccessToken, getRefreshToken, setAuthTokens } from "../../../core/storage/secureStorage";
import { ApiResponse } from "../../../shared/types/api";
import {
  AuthSessionMetaDto,
  CurrentUserDto,
  ChangePasswordRequestDto,
  ForgotPasswordRequestDto,
  LoginRequestDto,
  RefreshRequestDto,
  RegisterRequestDto,
  RegisterResponseDto,
  ResendVerificationOtpRequestDto,
  ResetPasswordRequestDto,
  VerifyEmailRequestDto,
} from "../models/auth.model";

async function persistTokensFromCookieLines(setCookieLines: string[]): Promise<void> {
  const tokens = extractAuthTokensFromSetCookie(setCookieLines);
  await setAuthTokens(tokens);

  if (!tokens.accessToken) {
    throw new AppError("Unable to read access token from auth response.", "UNAUTHORIZED", 401);
  }
}

export async function loginApi(payload: LoginRequestDto): Promise<AuthSessionMetaDto> {
  const response = await postAuthJson<AuthSessionMetaDto>(endpoints.auth.login, payload);
  await persistTokensFromCookieLines(response.setCookieLines);
  return response.payload.data;
}

export async function registerApi(payload: RegisterRequestDto): Promise<RegisterResponseDto> {
  const response = await authHttpClient.post<ApiResponse<RegisterResponseDto>>("/auth/register", payload);
  return response.data.data;
}

export async function verifyEmailApi(payload: VerifyEmailRequestDto): Promise<AuthSessionMetaDto> {
  const response = await postAuthJson<AuthSessionMetaDto>("/auth/verify-email", payload);
  await persistTokensFromCookieLines(response.setCookieLines);
  return response.payload.data;
}

export async function resendVerificationOtpApi(payload: ResendVerificationOtpRequestDto): Promise<void> {
  await authHttpClient.post<ApiResponse<null>>("/auth/resend-verification-otp", payload);
}

export async function refreshSessionApi(): Promise<AuthSessionMetaDto> {
  const savedRefreshToken = await getRefreshToken();
  const payload: Partial<RefreshRequestDto> = savedRefreshToken ? { refreshToken: savedRefreshToken } : {};
  const response = await postAuthJson<AuthSessionMetaDto>(endpoints.auth.refresh, payload);
  await persistTokensFromCookieLines(response.setCookieLines);
  return response.payload.data;
}

export async function getCurrentUserApi(): Promise<CurrentUserDto> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new AppError("Missing access token.", "UNAUTHORIZED", 401);
  }

  const response = await authHttpClient.get<ApiResponse<CurrentUserDto>>(endpoints.auth.me);
  return response.data.data;
}

export async function logoutApi(): Promise<void> {
  const accessToken = await getAccessToken();
  const savedRefreshToken = await getRefreshToken();

  if (accessToken) {
    await postAuthJsonWithBearer<null>(
      endpoints.auth.logout,
      savedRefreshToken ? { refreshToken: savedRefreshToken } : {},
      accessToken,
    );
    return;
  }

  await authHttpClient.post<ApiResponse<null>>(endpoints.auth.logout, savedRefreshToken ? { refreshToken: savedRefreshToken } : {});
}

export async function forgotPasswordApi(payload: ForgotPasswordRequestDto): Promise<void> {
  await authHttpClient.post<ApiResponse<null>>("/auth/forgot-password", payload);
}

export async function resetPasswordApi(payload: ResetPasswordRequestDto): Promise<void> {
  await authHttpClient.post<ApiResponse<null>>("/auth/reset-password", payload);
}

export async function changePasswordApi(payload: ChangePasswordRequestDto): Promise<void> {
  await authHttpClient.patch<ApiResponse<null>>(endpoints.auth.changePassword, payload);
}
