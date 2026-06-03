import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "@/lib/async-handler.js";
import { authenticate } from "@/middleware/auth.middleware.js";
import { validate } from "@/middleware/validate.middleware.js";
import { messageController } from "@/modules/messages/messages.controller.js";
import { createMessageSchema, createThreadSchema, threadParamsSchema } from "@/schemas/messages.schema.js";

export const messageRouter = Router();
const attachmentUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 3 } });

messageRouter.use(authenticate);
messageRouter.get("/threads", asyncHandler(messageController.threads));
messageRouter.get("/threads/:threadId", validate({ params: threadParamsSchema }), asyncHandler(messageController.thread));
messageRouter.post("/threads", validate({ body: createThreadSchema }), asyncHandler(messageController.createThread));
messageRouter.post(
  "/threads/:threadId/messages",
  validate({ params: threadParamsSchema, body: createMessageSchema }),
  asyncHandler(messageController.sendMessage)
);
messageRouter.post(
  "/threads/:threadId/messages/attachments",
  validate({ params: threadParamsSchema }),
  attachmentUpload.array("attachments", 3),
  asyncHandler(messageController.sendMessageWithAttachments)
);
messageRouter.patch(
  "/threads/:threadId/read",
  validate({ params: threadParamsSchema }),
  asyncHandler(messageController.markRead)
);
messageRouter.delete(
  "/threads/:threadId",
  validate({ params: threadParamsSchema }),
  asyncHandler(messageController.deleteThread)
);
