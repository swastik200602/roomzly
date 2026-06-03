import { z } from "zod";

export const createThreadSchema = z.object({
  propertyId: z.string().min(1),
  participantId: z.string().min(1).optional()
});

export const threadParamsSchema = z.object({
  threadId: z.string().min(1)
});

export const createMessageSchema = z.object({
  body: z.string().min(1).max(4000)
});
