import { Router } from "express";
import { authRouter } from "@/modules/auth/auth.routes.js";
import { propertyRouter } from "@/modules/properties/properties.routes.js";
import { bookingRouter } from "@/modules/bookings/bookings.routes.js";
import { wishlistRouter } from "@/modules/wishlist/wishlist.routes.js";
import { messageRouter } from "@/modules/messages/messages.routes.js";
import { analyticsRouter } from "@/modules/analytics/analytics.routes.js";
import { uploadRouter } from "@/modules/uploads/uploads.routes.js";
import { usersRouter } from "@/modules/users/users.routes.js";
import { notificationsRouter } from "@/modules/notifications/notifications.routes.js";
import { adminRouter } from "@/modules/admin/admin.routes.js";
import { reportsRouter } from "@/modules/reports/reports.routes.js";

export const router = Router();

router.use("/auth", authRouter);
router.use("/properties", propertyRouter);
router.use("/bookings", bookingRouter);
router.use("/wishlist", wishlistRouter);
router.use("/messages", messageRouter);
router.use("/analytics", analyticsRouter);
router.use("/upload", uploadRouter);
router.use("/users", usersRouter);
router.use("/notifications", notificationsRouter);
router.use("/admin", adminRouter);
router.use("/reports", reportsRouter);
