export type LoginRequestDto = {
  email: string;
  password: string;
};

export type LoginResponseDto = {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    fullName?: string;
  };
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};
