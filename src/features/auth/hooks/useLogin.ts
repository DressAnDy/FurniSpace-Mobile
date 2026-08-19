import { useLoginAction } from "./useAuthActions";

export function useLogin() {
  return useLoginAction();
}
