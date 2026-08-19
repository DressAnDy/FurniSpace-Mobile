import { AuthUser, CurrentUserDto } from "../models/auth.model";

export function mapUserFromCurrentUser(dto: CurrentUserDto): AuthUser {
  return {
    accountId: dto.accountId,
    email: dto.email,
    fullName: dto.fullName,
    phone: dto.phone,
    avatarUrl: dto.avatarUrl,
    status: dto.status,
    role: dto.role,
  };
}
