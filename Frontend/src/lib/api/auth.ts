import { apiRequest } from "@/lib/api/client";

export type UserRole = "RESIDENT" | "OWNER" | "ADMIN";

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  verified: boolean;
  phone?: string | null;
  phoneNumber?: string | null;
  phoneVerified: boolean;
  phoneVerifiedAt?: string | null;
  bio?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
};

export type AuthConfig = {
  googleClientId: string | null;
};

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role: UserRole;
};

export type RegisterResponse = {
  requiresEmailVerification: boolean;
  email: string;
  message: string;
};

export const authApi = {
  register(payload: RegisterPayload) {
    return apiRequest<RegisterResponse>("/auth/register", {
      method: "POST",
      body: payload,
    });
  },

  login(payload: { email: string; password: string }) {
    return apiRequest<AuthSession>("/auth/login", {
      method: "POST",
      body: payload,
    });
  },

  google(payload: { credential: string; role?: UserRole }) {
    return apiRequest<AuthSession>("/auth/google", {
      method: "POST",
      body: payload,
    });
  },

  refresh() {
    return apiRequest<AuthSession>("/auth/refresh", {
      method: "POST",
    });
  },

  logout() {
    return apiRequest<{ loggedOut: boolean }>("/auth/logout", {
      method: "POST",
    });
  },

  me() {
    return apiRequest<AuthUser>("/auth/me");
  },

  config() {
    return apiRequest<AuthConfig>("/auth/config");
  },

  forgotPassword(payload: { email: string }) {
    return apiRequest<{ accepted: boolean }>("/auth/forgot-password", {
      method: "POST",
      body: payload,
    });
  },

  resetPassword(payload: { token: string; password: string }) {
    return apiRequest<{ reset: boolean }>("/auth/reset-password", {
      method: "POST",
      body: payload,
    });
  },

  verifyPhone(payload: { phoneNumber: string }) {
    return apiRequest<AuthUser>("/auth/verify-phone", {
      method: "POST",
      body: payload,
    });
  },

  verifyEmail(payload: { token: string }) {
    return apiRequest<AuthSession>("/auth/verify-email", {
      method: "POST",
      body: payload,
    });
  },

  resendVerification(payload: { email: string }) {
    return apiRequest<{ accepted?: boolean; alreadyVerified?: boolean; message: string }>("/auth/resend-verification", {
      method: "POST",
      body: payload,
    });
  },
};
