import type { NextFunction, Request, Response } from "express";
import { redis } from "@/lib/redis.js";
import { AppError } from "@/lib/app-error.js";
import { logger } from "@/lib/logger.js";

export function rateLimitMiddleware(scope: string, limit: number, windowSeconds: number) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const identity = req.user?.id ?? req.ip ?? "unknown";
    const key = `ratelimit:${identity}:${scope}`;
    try {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, windowSeconds);
      if (count > limit) {
        throw new AppError(429, "RATE_LIMITED", "Too many requests");
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.warn({ error, key }, "Rate limiter degraded");
    }
    next();
  };
}
