import type { Request, Response } from "express";
import { created } from "@/lib/api-response.js";
import { badRequest } from "@/lib/app-error.js";
import { uploadService } from "@/modules/uploads/uploads.service.js";

export const uploadController = {
  async image(req: Request, res: Response) {
    if (!req.file) throw badRequest("Image file is required");
    const query = req.query as unknown as { type: "avatar" | "property"; propertyId?: string };
    return created(res, await uploadService.image(req.user!.id, req.file, query.type, query.propertyId));
  },

  async images(req: Request, res: Response) {
    const files = req.files;
    if (!Array.isArray(files) || files.length === 0) throw badRequest("Image files are required");
    const query = req.query as unknown as { propertyId?: string };
    return created(res, await uploadService.images(req.user!.id, files, query.propertyId));
  }
};
