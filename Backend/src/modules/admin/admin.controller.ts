import type { Request, Response } from "express";
import { ok } from "@/lib/api-response.js";
import { param } from "@/lib/request-param.js";
import { auditContextFromRequest } from "@/modules/admin/admin-audit.service.js";
import { adminService } from "@/modules/admin/admin.service.js";
import type {
  AdminAuditLogQueryInput,
  AdminBookingQueryInput,
  AdminPropertyQueryInput,
  AdminReportQueryInput,
  AdminReviewVerificationDocumentInput,
  AdminUpdateReportInput,
  AdminUpdatePropertyInput,
  AdminUpdateUserInput,
  AdminUserQueryInput
} from "@/schemas/admin.schema.js";

export const adminController = {
  async overview(_req: Request, res: Response) {
    return ok(res, await adminService.overview());
  },

  async users(req: Request, res: Response) {
    const result = await adminService.users(req.validatedQuery as AdminUserQueryInput);
    return ok(res, result.data, result.meta);
  },

  async updateUser(req: Request, res: Response) {
    return ok(
      res,
      await adminService.updateUser(
        req.user!.id,
        param(req.params.id, "id"),
        req.body as AdminUpdateUserInput,
        auditContextFromRequest(req)
      )
    );
  },

  async properties(req: Request, res: Response) {
    const result = await adminService.properties(req.validatedQuery as AdminPropertyQueryInput);
    return ok(res, result.data, result.meta);
  },

  async updateProperty(req: Request, res: Response) {
    return ok(
      res,
      await adminService.updateProperty(
        req.user!.id,
        param(req.params.id, "id"),
        req.body as AdminUpdatePropertyInput,
        auditContextFromRequest(req)
      )
    );
  },

  async bookings(req: Request, res: Response) {
    const result = await adminService.bookings(req.validatedQuery as AdminBookingQueryInput);
    return ok(res, result.data, result.meta);
  },

  async auditLogs(req: Request, res: Response) {
    const result = await adminService.auditLogs(req.validatedQuery as AdminAuditLogQueryInput);
    return ok(res, result.data, result.meta);
  },

  async verificationQueue(_req: Request, res: Response) {
    return ok(res, await adminService.verificationQueue());
  },

  async propertyVerificationQueue(_req: Request, res: Response) {
    return ok(res, await adminService.propertyVerificationQueue());
  },

  async reviewVerificationDocument(req: Request, res: Response) {
    return ok(
      res,
      await adminService.reviewVerificationDocument(
        req.user!.id,
        param(req.params.id, "id"),
        req.body as AdminReviewVerificationDocumentInput,
        auditContextFromRequest(req)
      )
    );
  },

  async reviewPropertyVerificationDocument(req: Request, res: Response) {
    return ok(
      res,
      await adminService.reviewPropertyVerificationDocument(
        req.user!.id,
        param(req.params.id, "id"),
        req.body as AdminReviewVerificationDocumentInput,
        auditContextFromRequest(req)
      )
    );
  },

  async reports(req: Request, res: Response) {
    const result = await adminService.reports(req.validatedQuery as AdminReportQueryInput);
    return ok(res, result.data, result.meta);
  },

  async updateReport(req: Request, res: Response) {
    return ok(
      res,
      await adminService.updateReport(
        req.user!.id,
        param(req.params.id, "id"),
        req.body as AdminUpdateReportInput,
        auditContextFromRequest(req)
      )
    );
  }
};
