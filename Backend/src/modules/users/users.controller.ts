import type { Request, Response } from "express";
import { created, ok } from "@/lib/api-response.js";
import { badRequest } from "@/lib/app-error.js";
import { param } from "@/lib/request-param.js";
import { userService } from "@/modules/users/users.service.js";
import type {
  AdminVerificationQueryInput,
  ReviewVerificationDocumentInput,
  UpdateProfileInput,
  VerificationDocumentUploadInput
} from "@/schemas/users.schema.js";

export const usersController = {
  async updateMe(req: Request, res: Response) {
    return ok(res, await userService.updateProfile(req.user!.id, req.body as UpdateProfileInput));
  },

  async avatar(req: Request, res: Response) {
    if (!req.file) throw badRequest("Avatar image is required");
    return ok(res, await userService.updateAvatar(req.user!.id, req.file));
  },

  async verificationDocuments(req: Request, res: Response) {
    return ok(res, await userService.listVerificationDocuments(req.user!.id));
  },

  async uploadVerificationDocument(req: Request, res: Response) {
    if (!req.file) throw badRequest("Verification document image is required");
    return created(
      res,
      await userService.uploadVerificationDocument(
        req.user!.id,
        req.body as VerificationDocumentUploadInput,
        req.file
      )
    );
  },

  async verificationQueue(req: Request, res: Response) {
    return ok(res, await userService.listVerificationQueue(req.validatedQuery as AdminVerificationQueryInput));
  },

  async reviewVerificationDocument(req: Request, res: Response) {
    return ok(
      res,
      await userService.reviewVerificationDocument(
        param(req.params.documentId, "documentId"),
        req.body as ReviewVerificationDocumentInput
      )
    );
  },
};
