import type { Request, Response } from "express";
import { ok } from "@/lib/api-response.js";
import { analyticsService } from "@/modules/analytics/analytics.service.js";

export const analyticsController = {
  async overview(req: Request, res: Response) {
    return ok(res, await analyticsService.overview(req.user!));
  },
  async revenue(req: Request, res: Response) {
    return ok(res, await analyticsService.revenue(req.user!));
  },
  async topProperties(req: Request, res: Response) {
    return ok(res, await analyticsService.topProperties(req.user!));
  },
  async traffic(req: Request, res: Response) {
    return ok(res, await analyticsService.traffic(req.user!));
  }
};
