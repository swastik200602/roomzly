import { AdminAuditAction, BookingStatus, ReportStatus, UserRole, VerificationStatus } from "@prisma/client";
import { z } from "zod";

export const adminPaginationSchema = z.object({
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25)
});

export const adminUserQuerySchema = adminPaginationSchema.extend({
  role: z.nativeEnum(UserRole).optional(),
  active: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  phoneVerified: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional()
});

export const adminPropertyQuerySchema = adminPaginationSchema.extend({
  active: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  verified: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional()
});

export const adminBookingQuerySchema = adminPaginationSchema.extend({
  status: z.nativeEnum(BookingStatus).optional()
});

export const adminAuditLogQuerySchema = adminPaginationSchema.extend({
  action: z.nativeEnum(AdminAuditAction).optional(),
  targetType: z.string().trim().max(80).optional()
});

export const adminIdParamsSchema = z.object({
  id: z.string().min(1)
});

export const adminUpdateUserSchema = z.object({
  active: z.boolean().optional(),
  verified: z.boolean().optional(),
  phoneVerified: z.boolean().optional(),
  role: z.enum([UserRole.RESIDENT, UserRole.OWNER]).optional()
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one user field is required"
});

export const adminUpdatePropertySchema = z.object({
  active: z.boolean().optional(),
  verified: z.boolean().optional(),
  premium: z.boolean().optional()
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one property field is required"
});

export const adminReviewVerificationDocumentSchema = z.object({
  status: z.enum([
    VerificationStatus.UNDER_REVIEW,
    VerificationStatus.VERIFIED,
    VerificationStatus.REJECTED,
    VerificationStatus.RESUBMISSION_REQUESTED
  ]),
  rejectionReason: z.string().trim().max(500).optional()
}).superRefine((value, ctx) => {
  const needsReason =
    value.status === VerificationStatus.REJECTED ||
    value.status === VerificationStatus.RESUBMISSION_REQUESTED;
  if (needsReason && !value.rejectionReason) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["rejectionReason"],
      message: "A reason is required for rejection or resubmission"
    });
  }
});

export const adminReportQuerySchema = adminPaginationSchema.extend({
  status: z.nativeEnum(ReportStatus).optional()
});

export const adminUpdateReportSchema = z.object({
  status: z.nativeEnum(ReportStatus),
  resolution: z.string().trim().max(1000).optional()
}).superRefine((value, ctx) => {
  if (value.status === ReportStatus.RESOLVED && !value.resolution) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["resolution"],
      message: "A resolution is required when resolving a report"
    });
  }
});

export type AdminUserQueryInput = z.infer<typeof adminUserQuerySchema>;
export type AdminPropertyQueryInput = z.infer<typeof adminPropertyQuerySchema>;
export type AdminBookingQueryInput = z.infer<typeof adminBookingQuerySchema>;
export type AdminAuditLogQueryInput = z.infer<typeof adminAuditLogQuerySchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type AdminUpdatePropertyInput = z.infer<typeof adminUpdatePropertySchema>;
export type AdminReviewVerificationDocumentInput = z.infer<typeof adminReviewVerificationDocumentSchema>;
export type AdminReportQueryInput = z.infer<typeof adminReportQuerySchema>;
export type AdminUpdateReportInput = z.infer<typeof adminUpdateReportSchema>;
