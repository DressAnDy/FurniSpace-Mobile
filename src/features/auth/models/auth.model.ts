export type LoginRequestDto = {
  email: string;
  password: string;
};

export type RegisterRequestDto = {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
};

export type RegisterResponseDto = {
  accountId: string;
  email: string;
  emailDeliveryStatus: "sent" | "failed";
};

export type VerifyEmailRequestDto = {
  email: string;
  otpCode: string;
};

export type ResendVerificationOtpRequestDto = {
  email: string;
};

export type AuthSessionMetaDto = {
  access_token_expires_at: string;
  token_type: string;
  expires_in: number;
};

export type RefreshRequestDto = {
  refreshToken: string;
};

export type ForgotPasswordRequestDto = {
  email: string;
};

export type ResetPasswordRequestDto = {
  email: string;
  token: string;
  newPassword: string;
};

export type ChangePasswordRequestDto = {
  currentPassword: string;
  newPassword: string;
};

export type CurrentUserDto = {
  accountId: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  status: "ACTIVE" | "INACTIVE";
  role: "CUSTOMER" | "SALES" | "DESIGNER" | "PRODUCTION" | "ADMIN";
};

export type AuthUser = {
  accountId: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  status: CurrentUserDto["status"];
  role: CurrentUserDto["role"];
};
