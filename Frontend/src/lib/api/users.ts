import { apiRequest } from "@/lib/api/client";
import type { AuthUser } from "@/lib/api/auth";

export type UpdateProfilePayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
};

export type VerificationStatus = "MISSING" | "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | "RESUBMISSION_REQUESTED";

export type VerificationDocument = {
  id: string;
  userId: string;
  type: string;
  status: VerificationStatus;
  fileUrl: string;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export const usersApi = {
  updateMe(payload: UpdateProfilePayload) {
    return apiRequest<AuthUser>("/users/me", {
      method: "PATCH",
      body: payload,
    });
  },

  avatar(file: File) {
    const form = new FormData();
    form.append("avatar", file);
    return apiRequest<AuthUser>("/users/me/avatar", {
      method: "POST",
      body: form,
    });
  },

  verificationDocuments() {
    return apiRequest<VerificationDocument[]>("/users/me/verification-documents");
  },

  uploadVerificationDocument(payload: { type: string; file: File }) {
    const form = new FormData();
    form.append("type", payload.type);
    form.append("document", payload.file);
    return apiRequest<VerificationDocument>("/users/me/verification-documents", {
      method: "POST",
      body: form,
    });
  },
};
