import { UserRole } from "@prisma/client";
import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "@/lib/async-handler.js";
import { authenticate, requirePhoneVerified, requireRole } from "@/middleware/auth.middleware.js";
import { validate } from "@/middleware/validate.middleware.js";
import { usersController } from "@/modules/users/users.controller.js";
import {
  adminVerificationQuerySchema,
  reviewVerificationDocumentSchema,
  updateProfileSchema,
  verificationDocumentParamsSchema,
  verificationDocumentUploadSchema
} from "@/schemas/users.schema.js";

const avatarUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024, files: 1 } });
const verificationUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1 } });

export const usersRouter = Router();

usersRouter.use(authenticate);
usersRouter.patch("/me", validate({ body: updateProfileSchema }), asyncHandler(usersController.updateMe));
usersRouter.post("/me/avatar", avatarUpload.single("avatar"), asyncHandler(usersController.avatar));
usersRouter.get("/me/verification-documents", asyncHandler(usersController.verificationDocuments));
usersRouter.post(
  "/me/verification-documents",
  requireRole(UserRole.OWNER, UserRole.ADMIN),
  requirePhoneVerified,
  verificationUpload.single("document"),
  validate({ body: verificationDocumentUploadSchema }),
  asyncHandler(usersController.uploadVerificationDocument)
);
usersRouter.get(
  "/verification-documents",
  requireRole(UserRole.ADMIN),
  validate({ query: adminVerificationQuerySchema }),
  asyncHandler(usersController.verificationQueue)
);
usersRouter.patch(
  "/verification-documents/:documentId/review",
  requireRole(UserRole.ADMIN),
  validate({ params: verificationDocumentParamsSchema, body: reviewVerificationDocumentSchema }),
  asyncHandler(usersController.reviewVerificationDocument)
);
