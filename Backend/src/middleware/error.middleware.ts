import { Prisma } from "@prisma/client";
import type { ErrorRequestHandler } from "express";
import jwt from "jsonwebtoken";
import { MulterError } from "multer";
import { ZodError } from "zod";
import { AppError } from "@/lib/app-error.js";
import { logger } from "@/lib/logger.js";
import { isProduction } from "@/config/env.js";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {})
      }
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details: error.flatten()
      }
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const targets = Array.isArray(error.meta?.target) ? error.meta.target.map(String) : [];
      const isPhoneConflict = targets.includes("phoneNumber") || targets.includes("phone");
      res.status(409).json({
        success: false,
        error: {
          code: "CONFLICT",
          message: isPhoneConflict ? "Phone number is already used on another account" : "A record with this value already exists",
          details: isProduction ? undefined : { code: error.code, meta: error.meta }
        }
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: {
        code: "DATABASE_ERROR",
        message: "Database request failed",
        details: isProduction ? undefined : { code: error.code, meta: error.meta }
      }
    });
    return;
  }

  if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
    res.status(401).json({
      success: false,
      error: { code: "INVALID_TOKEN", message: "Invalid or expired token" }
    });
    return;
  }

  if (error instanceof MulterError) {
    res.status(400).json({
      success: false,
      error: { code: "UPLOAD_ERROR", message: error.message }
    });
    return;
  }

  logger.error({ error }, "Unhandled request error");
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong",
      details: isProduction ? undefined : String(error)
    }
  });
};
