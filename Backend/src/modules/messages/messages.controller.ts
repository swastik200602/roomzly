import type { Request, Response } from "express";
import { created, ok } from "@/lib/api-response.js";
import { param } from "@/lib/request-param.js";
import { messageService } from "@/modules/messages/messages.service.js";

export const messageController = {
  async threads(req: Request, res: Response) {
    return ok(res, await messageService.listThreads(req.user!.id));
  },
  async thread(req: Request, res: Response) {
    return ok(res, await messageService.getThread(req.user!.id, param(req.params.threadId, "threadId")));
  },
  async createThread(req: Request, res: Response) {
    const body = req.body as { propertyId: string; participantId?: string };
    return created(res, await messageService.createThread(req.user!.id, body.propertyId, body.participantId));
  },
  async sendMessage(req: Request, res: Response) {
    const body = req.body as { body: string };
    return created(res, await messageService.sendMessage(req.user!.id, param(req.params.threadId, "threadId"), body.body));
  },
  async sendMessageWithAttachments(req: Request, res: Response) {
    const body = req.body as { body?: string };
    const files = Array.isArray(req.files) ? req.files : [];
    return created(
      res,
      await messageService.sendMessage(req.user!.id, param(req.params.threadId, "threadId"), body.body ?? "", files)
    );
  },
  async markRead(req: Request, res: Response) {
    return ok(res, await messageService.markRead(req.user!.id, param(req.params.threadId, "threadId")));
  },
  async deleteThread(req: Request, res: Response) {
    return ok(res, await messageService.deleteThread(req.user!.id, param(req.params.threadId, "threadId")));
  }
};
