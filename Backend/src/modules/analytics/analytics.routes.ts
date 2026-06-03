import { Router } from "express";
import { UserRole } from "@prisma/client";
import { asyncHandler } from "@/lib/async-handler.js";
import { authenticate, requireRole } from "@/middleware/auth.middleware.js";
import { analyticsController } from "@/modules/analytics/analytics.controller.js";

export const analyticsRouter = Router();

analyticsRouter.use(authenticate, requireRole(UserRole.OWNER, UserRole.ADMIN));
analyticsRouter.get("/overview", asyncHandler(analyticsController.overview));
analyticsRouter.get("/revenue", asyncHandler(analyticsController.revenue));
analyticsRouter.get("/top-properties", asyncHandler(analyticsController.topProperties));
analyticsRouter.get("/traffic", asyncHandler(analyticsController.traffic));
