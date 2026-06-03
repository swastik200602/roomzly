import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";

import { env, isProduction } from "@/config/env.js";
import { allowedOrigins, isAllowedOrigin } from "@/config/cors.js";
import { openApiSpec } from "@/docs/openapi.js";
import { errorMiddleware } from "@/middleware/error.middleware.js";
import { rateLimitMiddleware } from "@/middleware/rate-limit.middleware.js";
import { router } from "@/routes.js";
import { logger } from "@/lib/logger.js";
import { prisma } from "@/lib/prisma.js";
import { redis } from "@/lib/redis.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
    })
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (isAllowedOrigin(origin)) return callback(null, true);
        return callback(new Error(`CORS origin not allowed: ${origin}`));
      },
      credentials: true
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));
  app.use(rateLimitMiddleware("global", 100, 60));

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      version: env.APP_VERSION
    });
  });

  app.get("/ready", async (_req, res) => {
    const database = await prisma
      .$queryRaw`SELECT 1`
      .then(() => "ok")
      .catch((error: unknown) => {
        logger.error({ error }, "Database readiness check failed");
        return "error";
      });

    const cache = await redis
      .ping()
      .then(() => "ok")
      .catch((error: unknown) => {
        logger.warn({ error }, "Redis readiness check failed");
        return "error";
      });

    const ready = database === "ok" && cache === "ok";
    res.status(ready ? 200 : 503).json({
      status: ready ? "ready" : "degraded",
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      version: env.APP_VERSION,
      database,
      redis: cache
    });
  });

  app.use(`/api/${env.API_VERSION}`, router);

  if (!isProduction) {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
  }

  if (!isProduction) {
    app.get("/", (_req, res) => {
      res.json({ success: true, data: { service: "roomzly-backend" } });
    });
  }

  app.use(errorMiddleware);

  return app;
}
