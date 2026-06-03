import { Router } from "express";
import { asyncHandler } from "@/lib/async-handler.js";
import { authenticate } from "@/middleware/auth.middleware.js";
import { validate } from "@/middleware/validate.middleware.js";
import { bookingController } from "@/modules/bookings/bookings.controller.js";
import { bookingIdParamsSchema, bookingQuerySchema, createBookingSchema } from "@/schemas/bookings.schema.js";

export const bookingRouter = Router();

bookingRouter.use(authenticate);
bookingRouter.get("/", validate({ query: bookingQuerySchema }), asyncHandler(bookingController.list));
bookingRouter.get("/my", asyncHandler(bookingController.my));
bookingRouter.get("/export", asyncHandler(bookingController.exportCsv));
bookingRouter.post("/", validate({ body: createBookingSchema }), asyncHandler(bookingController.create));
bookingRouter.patch("/:id/confirm", validate({ params: bookingIdParamsSchema }), asyncHandler(bookingController.confirm));
bookingRouter.patch("/:id/cancel", validate({ params: bookingIdParamsSchema }), asyncHandler(bookingController.cancel));
