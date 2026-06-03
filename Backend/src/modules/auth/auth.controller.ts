import type { Request, Response } from "express";
import { created, ok } from "@/lib/api-response.js";
import { env } from "@/config/env.js";
import { auditContextFromRequest } from "@/modules/admin/admin-audit.service.js";
import { authService } from "@/modules/auth/auth.service.js";
import type { GoogleAuthInput, LoginInput, RegisterInput, VerifyPhoneInput } from "@/schemas/auth.schema.js";

export const authController = {
  async config(_req: Request, res: Response) {
    res.setHeader("Cache-Control", "no-store");
    return ok(res, {
      googleClientId: env.GOOGLE_CLIENT_ID ?? null
    });
  },

  async register(req: Request, res: Response) {
    return created(res, await authService.register(req.body as RegisterInput, res));
  },

  async login(req: Request, res: Response) {
    return ok(res, await authService.login(req.body as LoginInput, res, auditContextFromRequest(req)));
  },

  async google(req: Request, res: Response) {
    return ok(res, await authService.google(req.body as GoogleAuthInput, res, auditContextFromRequest(req)));
  },

  async refresh(req: Request, res: Response) {
    return ok(res, await authService.refresh(req.cookies.roomzly_refresh as string | undefined, res));
  },

  async logout(req: Request, res: Response) {
    return ok(res, await authService.logout(req.cookies.roomzly_refresh as string | undefined, res, auditContextFromRequest(req)));
  },

  async me(req: Request, res: Response) {
    return ok(res, await authService.me(req.user!.id));
  },

  async verifyPhone(req: Request, res: Response) {
    const body = req.body as VerifyPhoneInput;
    return ok(res, await authService.submitPhoneVerification(req.user!.id, body.phoneNumber));
  },

  async forgotPassword(req: Request, res: Response) {
    const body = req.body as { email: string };
    return ok(res, await authService.forgotPassword(body.email));
  },

  async resetPassword(req: Request, res: Response) {
    const body = req.body as { token: string; password: string };
    return ok(res, await authService.resetPassword(body.token, body.password));
  }
};
