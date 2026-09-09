import { UserRole } from "@prisma/client";
import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  phoneNumber: z.string().trim().min(8).max(20).optional(),
  role: z.nativeEnum(UserRole).default(UserRole.RESIDENT)
}).superRefine((value, ctx) => {
  if (value.role === UserRole.OWNER && !value.phoneNumber) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["phoneNumber"],
      message: "Phone number is required for owner accounts"
    });
  }
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(8).max(128)
});

export const googleAuthSchema = z.object({
  credential: z.string().min(10),
  role: z.nativeEnum(UserRole).default(UserRole.RESIDENT)
});

export const verifyPhoneSchema = z.object({
  phoneNumber: z.string().trim().min(8).max(20)
});

export const verifyEmailSchema = z.object({
  token: z.string().min(32)
});

export const resendVerificationSchema = z.object({
  email: z.string().email().toLowerCase()
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type VerifyPhoneInput = z.infer<typeof verifyPhoneSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
