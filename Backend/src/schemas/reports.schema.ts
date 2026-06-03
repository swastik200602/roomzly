import { ReportTargetType, ReportType } from "@prisma/client";
import { z } from "zod";

export const createReportSchema = z.object({
  targetType: z.nativeEnum(ReportTargetType),
  targetId: z.string().min(1),
  type: z.nativeEnum(ReportType),
  description: z.string().trim().min(10).max(1500)
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
