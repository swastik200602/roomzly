import { Router } from "express";
import { asyncHandler } from "@/lib/async-handler.js";
import { authenticate } from "@/middleware/auth.middleware.js";
import { notificationsController } from "@/modules/notifications/notifications.controller.js";

export const notificationsRouter = Router();

notificationsRouter.use(authenticate);
notificationsRouter.get("/", asyncHandler(notificationsController.list));
notificationsRouter.get("/unread-count", asyncHandler(notificationsController.unreadCount));
notificationsRouter.patch("/read-all", asyncHandler(notificationsController.markAllRead));
notificationsRouter.patch("/:id/read", asyncHandler(notificationsController.markRead));
