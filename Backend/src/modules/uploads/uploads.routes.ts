import multer from "multer";
import { Router } from "express";
import { asyncHandler } from "@/lib/async-handler.js";
import { authenticate } from "@/middleware/auth.middleware.js";
import { rateLimitMiddleware } from "@/middleware/rate-limit.middleware.js";
import { validate } from "@/middleware/validate.middleware.js";
import { uploadController } from "@/modules/uploads/uploads.controller.js";
import { uploadImageQuerySchema } from "@/schemas/upload.schema.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 10 } });

export const uploadRouter = Router();

uploadRouter.use(authenticate, rateLimitMiddleware("uploads", 20, 60));
uploadRouter.post(
  "/image",
  validate({ query: uploadImageQuerySchema }),
  upload.single("image"),
  asyncHandler(uploadController.image)
);
uploadRouter.post("/images", upload.array("images", 10), asyncHandler(uploadController.images));
