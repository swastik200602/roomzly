import { Router } from "express";
import { asyncHandler } from "@/lib/async-handler.js";
import { authenticate } from "@/middleware/auth.middleware.js";
import { rateLimitMiddleware } from "@/middleware/rate-limit.middleware.js";
import { validate } from "@/middleware/validate.middleware.js";
import { reportsController } from "@/modules/reports/reports.controller.js";
import { createReportSchema } from "@/schemas/reports.schema.js";

export const reportsRouter = Router();

reportsRouter.use(authenticate, rateLimitMiddleware("reports", 10, 60));
reportsRouter.post("/", validate({ body: createReportSchema }), asyncHandler(reportsController.create));
