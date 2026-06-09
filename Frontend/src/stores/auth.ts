import { create } from "zustand";
import { registerAccessTokenGetter } from "@/lib/api/client";
import type { AuthSession, AuthUser } from "@/lib/api/auth";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  bootstrapped: boolean;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
  setBootstrapped: (bootstrapped: boolean) => void;
}

export const useAuth = create<AuthState>((set, get) => {
  registerAccessTokenGetter(() => get().accessToken);

  return {
    user: null,
    accessToken: null,
    bootstrapped: false,
    setSession: (session) =>
      set({
        user: session.user,
        accessToken: session.accessToken,
        bootstrapped: true,
      }),
    clearSession: () => set({ user: null, accessToken: null, bootstrapped: true }),
    setBootstrapped: (bootstrapped) => set({ bootstrapped }),
  };
});
