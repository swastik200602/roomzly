import { z } from "zod";

export const analyticsRangeSchema = z.object({
  range: z.enum(["12m", "6m", "3m", "1m"]).default("12m")
});
