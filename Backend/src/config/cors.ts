import { env } from "@/config/env.js";

const developmentOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174"
];

function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/$/, "");
}

const configuredOrigins = [
  env.FRONTEND_URL,
  ...(env.ADDITIONAL_CORS_ORIGINS?.split(",") ?? []),
  ...(env.NODE_ENV === "production" ? [] : developmentOrigins)
]
  .map(normalizeOrigin)
  .filter(Boolean);

export const allowedOrigins = [...new Set(configuredOrigins)];

export function isAllowedOrigin(origin: string | undefined) {
  return !origin || allowedOrigins.includes(normalizeOrigin(origin));
}
