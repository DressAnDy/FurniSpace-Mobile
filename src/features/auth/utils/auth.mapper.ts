import { AuthUser, LoginResponseDto } from "../models/auth.model";

export function mapUserFromLoginResponse(dto: LoginResponseDto): AuthUser {
  return {
    id: dto.user.id,
    email: dto.user.email,
    name: dto.user.fullName ?? dto.user.email,
  };
}
