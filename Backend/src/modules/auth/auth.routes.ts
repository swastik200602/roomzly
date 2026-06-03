import { Router } from "express";
import { asyncHandler } from "@/lib/async-handler.js";
import { authenticate } from "@/middleware/auth.middleware.js";
import { rateLimitMiddleware } from "@/middleware/rate-limit.middleware.js";
import { validate } from "@/middleware/validate.middleware.js";
import { authController } from "@/modules/auth/auth.controller.js";
import {
  forgotPasswordSchema,
  googleAuthSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyPhoneSchema
} from "@/schemas/auth.schema.js";

export const authRouter = Router();

authRouter.get("/config", asyncHandler(authController.config));
authRouter.post(
  "/register",
  rateLimitMiddleware("register", 3, 60),
  validate({ body: registerSchema }),
  asyncHandler(authController.register)
);
authRouter.post(
  "/login",
  rateLimitMiddleware("login", 5, 60),
  validate({ body: loginSchema }),
  asyncHandler(authController.login)
);
authRouter.post(
  "/google",
  rateLimitMiddleware("google-auth", 10, 60),
  validate({ body: googleAuthSchema }),
  asyncHandler(authController.google)
);
authRouter.post("/refresh", asyncHandler(authController.refresh));
authRouter.post("/logout", asyncHandler(authController.logout));
authRouter.get("/me", authenticate, asyncHandler(authController.me));
authRouter.post(
  "/verify-phone",
  authenticate,
  rateLimitMiddleware("verify-phone", 5, 60),
  validate({ body: verifyPhoneSchema }),
  asyncHandler(authController.verifyPhone)
);
authRouter.post(
  "/forgot-password",
  rateLimitMiddleware("forgot-password", 3, 15 * 60),
  validate({ body: forgotPasswordSchema }),
  asyncHandler(authController.forgotPassword)
);
authRouter.post(
  "/reset-password",
  validate({ body: resetPasswordSchema }),
  asyncHandler(authController.resetPassword)
);
