import { UserRole } from "@prisma/client";
import { Router } from "express";
import { asyncHandler } from "@/lib/async-handler.js";
import { authenticate, requireRole } from "@/middleware/auth.middleware.js";
import { rateLimitMiddleware } from "@/middleware/rate-limit.middleware.js";
import { validate } from "@/middleware/validate.middleware.js";
import { adminController } from "@/modules/admin/admin.controller.js";
import {
  adminBookingQuerySchema,
  adminAuditLogQuerySchema,
  adminIdParamsSchema,
  adminPropertyQuerySchema,
  adminReportQuerySchema,
  adminReviewVerificationDocumentSchema,
  adminUpdateReportSchema,
  adminUpdatePropertySchema,
  adminUpdateUserSchema,
  adminUserQuerySchema
} from "@/schemas/admin.schema.js";

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole(UserRole.ADMIN), rateLimitMiddleware("admin", 60, 60));
adminRouter.get("/overview", asyncHandler(adminController.overview));
adminRouter.get("/audit-logs", validate({ query: adminAuditLogQuerySchema }), asyncHandler(adminController.auditLogs));
adminRouter.get("/users", validate({ query: adminUserQuerySchema }), asyncHandler(adminController.users));
adminRouter.patch(
  "/users/:id",
  validate({ params: adminIdParamsSchema, body: adminUpdateUserSchema }),
  asyncHandler(adminController.updateUser)
);
adminRouter.get("/properties", validate({ query: adminPropertyQuerySchema }), asyncHandler(adminController.properties));
adminRouter.patch(
  "/properties/:id",
  validate({ params: adminIdParamsSchema, body: adminUpdatePropertySchema }),
  asyncHandler(adminController.updateProperty)
);
adminRouter.get("/bookings", validate({ query: adminBookingQuerySchema }), asyncHandler(adminController.bookings));
adminRouter.get("/verification-documents", asyncHandler(adminController.verificationQueue));
adminRouter.patch(
  "/verification-documents/:id/review",
  validate({ params: adminIdParamsSchema, body: adminReviewVerificationDocumentSchema }),
  asyncHandler(adminController.reviewVerificationDocument)
);
adminRouter.get("/property-verification-documents", asyncHandler(adminController.propertyVerificationQueue));
adminRouter.patch(
  "/property-verification-documents/:id/review",
  validate({ params: adminIdParamsSchema, body: adminReviewVerificationDocumentSchema }),
  asyncHandler(adminController.reviewPropertyVerificationDocument)
);
adminRouter.get("/reports", validate({ query: adminReportQuerySchema }), asyncHandler(adminController.reports));
adminRouter.patch(
  "/reports/:id",
  validate({ params: adminIdParamsSchema, body: adminUpdateReportSchema }),
  asyncHandler(adminController.updateReport)
);
