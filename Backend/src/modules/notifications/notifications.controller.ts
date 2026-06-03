import type { Request, Response } from "express";
import { ok } from "@/lib/api-response.js";
import { param } from "@/lib/request-param.js";
import { notificationService } from "@/modules/notifications/notifications.service.js";

export const notificationsController = {
  async list(req: Request, res: Response) {
    return ok(res, await notificationService.list(req.user!.id));
  },

  async unreadCount(req: Request, res: Response) {
    return ok(res, await notificationService.unreadCount(req.user!.id));
  },

  async markRead(req: Request, res: Response) {
    return ok(res, await notificationService.markRead(req.user!.id, param(req.params.id, "id")));
  },

  async markAllRead(req: Request, res: Response) {
    return ok(res, await notificationService.markAllRead(req.user!.id));
  },
};
