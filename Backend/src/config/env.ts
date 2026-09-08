import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  API_VERSION: z.string().default("v1"),
  APP_VERSION: z.string().default("0.1.0"),
  FRONTEND_URL: z.string().url(),
  ADDITIONAL_CORS_ORIGINS: z.string().optional(),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().optional(),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().optional(),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  EMAIL_FROM: z.string().min(1).default("Roomzly <noreply@roomzly.local>"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional()
});

export const env = envSchema.parse(process.env);

export const isProduction = env.NODE_ENV === "production";
