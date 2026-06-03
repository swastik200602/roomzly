import type { Request, Response } from "express";
import { created, ok } from "@/lib/api-response.js";
import { env } from "@/config/env.js";
import { param } from "@/lib/request-param.js";
import { propertyService } from "@/modules/properties/properties.service.js";
import type {
  CreatePropertyInput,
  CreateReviewInput,
  PropertyVerificationDocumentUploadInput,
  PropertyQueryInput,
  UpdateReviewInput,
  UpdatePropertyInput
} from "@/schemas/properties.schema.js";
import { badRequest } from "@/lib/app-error.js";

export const propertyController = {
  async list(req: Request, res: Response) {
    const result = await propertyService.list(req.validatedQuery as PropertyQueryInput);
    return ok(res, (result as { data: unknown }).data, (result as { meta: Record<string, unknown> }).meta);
  },

  async detail(req: Request, res: Response) {
    return ok(res, await propertyService.detail(param(req.params.slug, "slug"), trafficSource(req)));
  },

  async batch(req: Request, res: Response) {
    const body = req.body as { ids: string[] };
    return ok(res, await propertyService.batch(body.ids));
  },

  async facets(_req: Request, res: Response) {
    return ok(res, await propertyService.facets());
  },

  async ownerListings(req: Request, res: Response) {
    return ok(res, await propertyService.ownerListings(req.user!.id));
  },

  async create(req: Request, res: Response) {
    return created(res, await propertyService.create(req.user!.id, req.body as CreatePropertyInput));
  },

  async update(req: Request, res: Response) {
    return ok(res, await propertyService.update(req.user!, param(req.params.id, "id"), req.body as UpdatePropertyInput));
  },

  async remove(req: Request, res: Response) {
    return ok(res, await propertyService.softDelete(req.user!, param(req.params.id, "id")));
  },

  async addImages(req: Request, res: Response) {
    const files = req.files;
    if (!Array.isArray(files)) return ok(res, await propertyService.addImages(req.user!, param(req.params.id, "id"), []));
    return ok(res, await propertyService.addImages(req.user!, param(req.params.id, "id"), files));
  },

  async deleteImage(req: Request, res: Response) {
    return ok(
      res,
      await propertyService.deleteImage(
        req.user!,
        param(req.params.id, "id"),
        param(req.params.imageId, "imageId")
      )
    );
  },

  async verificationDocuments(req: Request, res: Response) {
    return ok(res, await propertyService.verificationDocuments(req.user!, param(req.params.id, "id")));
  },

  async uploadVerificationDocument(req: Request, res: Response) {
    if (!req.file) throw badRequest("Property verification document is required");
    return created(
      res,
      await propertyService.uploadVerificationDocument(
        req.user!,
        param(req.params.id, "id"),
        req.body as PropertyVerificationDocumentUploadInput,
        req.file
      )
    );
  },

  async reviews(req: Request, res: Response) {
    return ok(res, await propertyService.listReviews(param(req.params.slug, "slug")));
  },

  async createReview(req: Request, res: Response) {
    return created(
      res,
      await propertyService.createReview(req.user!, param(req.params.id, "id"), req.body as CreateReviewInput)
    );
  },

  async updateReview(req: Request, res: Response) {
    return ok(
      res,
      await propertyService.updateReview(
        req.user!,
        param(req.params.id, "id"),
        param(req.params.reviewId, "reviewId"),
        req.body as UpdateReviewInput
      )
    );
  },

  async deleteReview(req: Request, res: Response) {
    return ok(
      res,
      await propertyService.deleteReview(
        req.user!,
        param(req.params.id, "id"),
        param(req.params.reviewId, "reviewId")
      )
    );
  }
};

function trafficSource(req: Request): string {
  const explicit = req.query.source;
  if (typeof explicit === "string" && explicit.trim()) return explicit.trim().slice(0, 80);

  const referer = req.get("referer");
  if (!referer) return "Direct";
  try {
    const host = new URL(referer).hostname.toLowerCase();
    const frontendHost = new URL(env.FRONTEND_URL).hostname.toLowerCase();
    if (host === frontendHost) return "Direct";
    if (/(google|bing|duckduckgo|yahoo|baidu|yandex)\./.test(host)) return "Search";
    if (/(facebook|instagram|twitter|x|linkedin|pinterest|tiktok)\./.test(host)) return "Social";
    return "Referral";
  } catch {
    return "Referral";
  }
}
