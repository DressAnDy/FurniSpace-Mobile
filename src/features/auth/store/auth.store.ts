import { create } from "zustand";
import { AuthUser } from "../models/auth.model";

type AuthState = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  setUser: (user: AuthUser | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  setUser: (user) =>
    set({
      user,
      isLoggedIn: Boolean(user),
    }),
}));
