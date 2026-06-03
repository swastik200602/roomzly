import { z } from "zod";
import { VerificationStatus } from "@prisma/client";

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  phone: z.string().max(40).optional(),
  bio: z.string().max(500).optional()
});

export const verificationDocumentUploadSchema = z.object({
  type: z.string().trim().min(2).max(80)
});

export const verificationDocumentParamsSchema = z.object({
  documentId: z.string().min(1)
});

export const adminVerificationQuerySchema = z.object({
  status: z.nativeEnum(VerificationStatus).optional()
});

export const reviewVerificationDocumentSchema = z.object({
  status: z.nativeEnum(VerificationStatus).refine((status) => status !== VerificationStatus.MISSING, {
    message: "Verification review status must be pending, verified, or rejected"
  }),
  rejectionReason: z.string().trim().max(500).optional()
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type VerificationDocumentUploadInput = z.infer<typeof verificationDocumentUploadSchema>;
export type AdminVerificationQueryInput = z.infer<typeof adminVerificationQuerySchema>;
export type ReviewVerificationDocumentInput = z.infer<typeof reviewVerificationDocumentSchema>;
