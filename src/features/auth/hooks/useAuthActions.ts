import { useMutation } from "@tanstack/react-query";
import { AppError } from "../../../core/errors/AppError";
import { mapAxiosError } from "../../../core/errors/errorMapper";
import { clearAuthTokens } from "../../../core/storage/secureStorage";
import { disconnectNotificationHub } from "../../../core/realtime/notificationHub";
import { disconnectPaymentHub } from "../../../core/realtime/paymentHub";
import { disconnectProjectChatHub } from "../../../core/realtime/projectChatHub";
import {
  changePasswordApi,
  forgotPasswordApi,
  getCurrentUserApi,
  loginApi,
  logoutApi,
  registerApi,
  resendVerificationOtpApi,
  resetPasswordApi,
  verifyEmailApi,
} from "../services/auth.api";
import { mapUserFromCurrentUser } from "../utils/auth.mapper";
import { useAuthStore } from "../store/auth.store";

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  return mapAxiosError(error);
}

export function useLoginAction() {
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      try {
        await loginApi(payload);
        const currentUser = await getCurrentUserApi();
        return mapUserFromCurrentUser(currentUser);
      } catch (error) {
        throw toAppError(error);
      }
    },
    onSuccess: (user) => setUser(user),
  });
}

export function useRegisterAction() {
  return useMutation({
    mutationFn: async (payload: Parameters<typeof registerApi>[0]) => {
      try {
        return await registerApi(payload);
      } catch (error) {
        throw toAppError(error);
      }
    },
  });
}

export function useVerifyEmailAction() {
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (payload: { email: string; otpCode: string }) => {
      try {
        await verifyEmailApi(payload);
        const currentUser = await getCurrentUserApi();
        return mapUserFromCurrentUser(currentUser);
      } catch (error) {
        throw toAppError(error);
      }
    },
    onSuccess: (user) => setUser(user),
  });
}

export function useResendOtpAction() {
  return useMutation({
    mutationFn: async (payload: Parameters<typeof resendVerificationOtpApi>[0]) => {
      try {
        return await resendVerificationOtpApi(payload);
      } catch (error) {
        throw toAppError(error);
      }
    },
  });
}

export function useForgotPasswordAction() {
  return useMutation({
    mutationFn: async (payload: Parameters<typeof forgotPasswordApi>[0]) => {
      try {
        return await forgotPasswordApi(payload);
      } catch (error) {
        throw toAppError(error);
      }
    },
  });
}

export function useResetPasswordAction() {
  return useMutation({
    mutationFn: async (payload: Parameters<typeof resetPasswordApi>[0]) => {
      try {
        return await resetPasswordApi(payload);
      } catch (error) {
        throw toAppError(error);
      }
    },
  });
}

export function useChangePasswordAction() {
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (payload: Parameters<typeof changePasswordApi>[0]) => {
      try {
        await changePasswordApi(payload);
      } catch (error) {
        throw toAppError(error);
      }
    },
    onSuccess: async () => {
      await disconnectNotificationHub();
      await disconnectPaymentHub();
      await disconnectProjectChatHub();
      await clearAuthTokens();
      setUser(null);
    },
  });
}

export function useLogoutAction() {
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async () => {
      try {
        await logoutApi();
      } catch (error) {
        throw toAppError(error);
      }
    },
    onSettled: async () => {
      await disconnectNotificationHub();
      await disconnectPaymentHub();
      await disconnectProjectChatHub();
      await clearAuthTokens();
      setUser(null);
    },
  });
}
