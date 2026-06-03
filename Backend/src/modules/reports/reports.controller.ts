import type { Request, Response } from "express";
import { created } from "@/lib/api-response.js";
import { reportsService } from "@/modules/reports/reports.service.js";
import type { CreateReportInput } from "@/schemas/reports.schema.js";

export const reportsController = {
  async create(req: Request, res: Response) {
    return created(res, await reportsService.create(req.user!.id, req.body as CreateReportInput));
  }
};
