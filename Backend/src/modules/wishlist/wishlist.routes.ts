import { Router } from "express";
import { asyncHandler } from "@/lib/async-handler.js";
import { authenticate } from "@/middleware/auth.middleware.js";
import { validate } from "@/middleware/validate.middleware.js";
import { wishlistController } from "@/modules/wishlist/wishlist.controller.js";
import { wishlistParamsSchema, wishlistSyncSchema } from "@/schemas/wishlist.schema.js";

export const wishlistRouter = Router();

wishlistRouter.use(authenticate);
wishlistRouter.get("/", asyncHandler(wishlistController.list));
wishlistRouter.post("/sync", validate({ body: wishlistSyncSchema }), asyncHandler(wishlistController.sync));
wishlistRouter.post("/:propertyId", validate({ params: wishlistParamsSchema }), asyncHandler(wishlistController.add));
wishlistRouter.delete("/:propertyId", validate({ params: wishlistParamsSchema }), asyncHandler(wishlistController.remove));
