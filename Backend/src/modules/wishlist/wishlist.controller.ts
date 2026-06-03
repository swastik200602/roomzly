import type { Request, Response } from "express";
import { ok } from "@/lib/api-response.js";
import { param } from "@/lib/request-param.js";
import { wishlistService } from "@/modules/wishlist/wishlist.service.js";

export const wishlistController = {
  async list(req: Request, res: Response) {
    return ok(res, await wishlistService.list(req.user!.id));
  },
  async add(req: Request, res: Response) {
    return ok(res, await wishlistService.add(req.user!.id, param(req.params.propertyId, "propertyId")));
  },
  async remove(req: Request, res: Response) {
    return ok(res, await wishlistService.remove(req.user!.id, param(req.params.propertyId, "propertyId")));
  },
  async sync(req: Request, res: Response) {
    const body = req.body as { propertyIds: string[] };
    return ok(res, await wishlistService.sync(req.user!.id, body.propertyIds));
  }
};
