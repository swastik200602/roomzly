import type { Request, Response } from "express";
import { created, ok } from "@/lib/api-response.js";
import { param } from "@/lib/request-param.js";
import { bookingService } from "@/modules/bookings/bookings.service.js";
import type { CreateBookingInput } from "@/schemas/bookings.schema.js";

export const bookingController = {
  async list(req: Request, res: Response) {
    const query = req.validatedQuery as { page: number; limit: number };
    const result = await bookingService.list(req.user!, query.page, query.limit);
    return ok(res, result.data, result.meta);
  },

  async my(req: Request, res: Response) {
    const result = await bookingService.list(req.user!, 1, 50);
    return ok(res, result.data, result.meta);
  },

  async create(req: Request, res: Response) {
    return created(res, await bookingService.create(req.user!.id, req.body as CreateBookingInput));
  },

  async confirm(req: Request, res: Response) {
    return ok(res, await bookingService.confirm(req.user!, param(req.params.id, "id")));
  },

  async cancel(req: Request, res: Response) {
    return ok(res, await bookingService.cancel(req.user!, param(req.params.id, "id")));
  },

  async exportCsv(req: Request, res: Response) {
    const csv = await bookingService.exportCsv(req.user!);
    res.header("content-type", "text/csv; charset=utf-8");
    res.attachment("bookings.csv");
    return res.send(csv);
  }
};
