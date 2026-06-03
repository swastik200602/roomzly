import { Redis } from "ioredis";
import { env } from "@/config/env.js";
import { logger } from "@/lib/logger.js";

const redisUsesTls = env.REDIS_URL.startsWith("rediss://") || env.REDIS_URL.includes("upstash.io");

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 2,
  enableReadyCheck: false,
  lazyConnect: true,
  enableOfflineQueue: false,
  commandTimeout: 5000,
  ...(redisUsesTls ? { tls: {} } : {})
});

redis.on("error", (error: Error) => {
  logger.warn({ error }, "Redis failure");
});

async function ensureRedis(): Promise<boolean> {
  if (redis.status === "ready") return true;
  try {
    await redis.connect();
    return true;
  } catch (error) {
    logger.warn({ error }, "Redis connect failed");
    return false;
  }
}

export async function safeCacheGet(key: string): Promise<string | null> {
  try {
    if (!(await ensureRedis())) return null;
    return await redis.get(key);
  } catch (error) {
    logger.warn({ error, key }, "Redis get failed");
    return null;
  }
}

export async function safeCacheSet(key: string, value: string, seconds: number): Promise<void> {
  try {
    if (!(await ensureRedis())) return;
    await redis.set(key, value, "EX", seconds);
  } catch (error) {
    logger.warn({ error, key }, "Redis set failed");
  }
}

export async function safeCacheDelete(patternOrKey: string): Promise<void> {
  try {
    if (!(await ensureRedis())) return;
    if (!patternOrKey.includes("*")) {
      await redis.del(patternOrKey);
      return;
    }

    const stream = redis.scanStream({ match: patternOrKey, count: 100 });
    const keys: string[] = [];
    for await (const chunk of stream) {
      keys.push(...(chunk as string[]));
    }
    if (keys.length > 0) await redis.del(...keys);
  } catch (error) {
    logger.warn({ error, patternOrKey }, "Redis delete failed");
  }
}
