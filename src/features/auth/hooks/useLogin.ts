import { useMutation } from "@tanstack/react-query";
import { mapAxiosError } from "../../../core/errors/errorMapper";
import { setAccessToken } from "../../../core/storage/secureStorage";
import { loginApi } from "../services/auth.api";
import { mapUserFromLoginResponse } from "../utils/auth.mapper";
import { useAuthStore } from "../store/auth.store";

type LoginInput = {
  email: string;
  password: string;
};

export function useLogin() {
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (payload: LoginInput) => {
      const response = await loginApi(payload);
      await setAccessToken(response.accessToken);
      return mapUserFromLoginResponse(response);
    },
    onSuccess: (user) => {
      setUser(user);
    },
    onError: (error) => {
      throw mapAxiosError(error);
    },
  });
}
