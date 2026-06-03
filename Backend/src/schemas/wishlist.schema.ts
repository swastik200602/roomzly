import { z } from "zod";

export const wishlistParamsSchema = z.object({
  propertyId: z.string().min(1)
});

export const wishlistSyncSchema = z.object({
  propertyIds: z.array(z.string().min(1)).max(100)
});
