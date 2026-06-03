import { z } from "zod";

export const uploadImageQuerySchema = z.object({
  type: z.enum(["avatar", "property"]).default("property"),
  propertyId: z.string().optional()
});
