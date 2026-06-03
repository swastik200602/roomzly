import { UserRole } from "@prisma/client";
import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "@/lib/async-handler.js";
import { authenticate, requirePhoneVerified, requireRole } from "@/middleware/auth.middleware.js";
import { validate } from "@/middleware/validate.middleware.js";
import { propertyController } from "@/modules/properties/properties.controller.js";
import {
  createReviewSchema,
  propertyBatchSchema,
  createPropertySchema,
  propertyIdParamsSchema,
  propertyQuerySchema,
  propertyVerificationDocumentUploadSchema,
  propertyReviewParamsSchema,
  propertySlugParamsSchema,
  updateReviewSchema,
  updatePropertySchema
} from "@/schemas/properties.schema.js";

export const propertyRouter = Router();
const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 10 } });
const verificationUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1 } });

propertyRouter.get("/", validate({ query: propertyQuerySchema }), asyncHandler(propertyController.list));
propertyRouter.get("/meta/facets", asyncHandler(propertyController.facets));
propertyRouter.post("/batch", validate({ body: propertyBatchSchema }), asyncHandler(propertyController.batch));
propertyRouter.get(
  "/owner/listings",
  authenticate,
  requireRole(UserRole.OWNER, UserRole.ADMIN),
  asyncHandler(propertyController.ownerListings)
);
propertyRouter.get(
  "/:slug/reviews",
  validate({ params: propertySlugParamsSchema }),
  asyncHandler(propertyController.reviews)
);
propertyRouter.get("/:slug", validate({ params: propertySlugParamsSchema }), asyncHandler(propertyController.detail));
propertyRouter.post(
  "/",
  authenticate,
  requireRole(UserRole.OWNER, UserRole.ADMIN),
  requirePhoneVerified,
  validate({ body: createPropertySchema }),
  asyncHandler(propertyController.create)
);
propertyRouter.patch(
  "/:id",
  authenticate,
  requireRole(UserRole.OWNER, UserRole.ADMIN),
  requirePhoneVerified,
  validate({ params: propertyIdParamsSchema, body: updatePropertySchema }),
  asyncHandler(propertyController.update)
);
propertyRouter.post(
  "/:id/images",
  authenticate,
  requireRole(UserRole.OWNER, UserRole.ADMIN),
  requirePhoneVerified,
  validate({ params: propertyIdParamsSchema }),
  imageUpload.array("images", 10),
  asyncHandler(propertyController.addImages)
);
propertyRouter.get(
  "/:id/verification-documents",
  authenticate,
  requireRole(UserRole.OWNER, UserRole.ADMIN),
  validate({ params: propertyIdParamsSchema }),
  asyncHandler(propertyController.verificationDocuments)
);
propertyRouter.post(
  "/:id/verification-documents",
  authenticate,
  requireRole(UserRole.OWNER, UserRole.ADMIN),
  requirePhoneVerified,
  validate({ params: propertyIdParamsSchema, body: propertyVerificationDocumentUploadSchema }),
  verificationUpload.single("document"),
  asyncHandler(propertyController.uploadVerificationDocument)
);
propertyRouter.post(
  "/:id/reviews",
  authenticate,
  validate({ params: propertyIdParamsSchema, body: createReviewSchema }),
  asyncHandler(propertyController.createReview)
);
propertyRouter.patch(
  "/:id/reviews/:reviewId",
  authenticate,
  validate({ params: propertyReviewParamsSchema, body: updateReviewSchema }),
  asyncHandler(propertyController.updateReview)
);
propertyRouter.delete(
  "/:id/reviews/:reviewId",
  authenticate,
  validate({ params: propertyReviewParamsSchema }),
  asyncHandler(propertyController.deleteReview)
);
propertyRouter.delete(
  "/:id/images/:imageId",
  authenticate,
  requireRole(UserRole.OWNER, UserRole.ADMIN),
  requirePhoneVerified,
  asyncHandler(propertyController.deleteImage)
);
propertyRouter.delete(
  "/:id",
  authenticate,
  requireRole(UserRole.OWNER, UserRole.ADMIN),
  requirePhoneVerified,
  validate({ params: propertyIdParamsSchema }),
  asyncHandler(propertyController.remove)
);
