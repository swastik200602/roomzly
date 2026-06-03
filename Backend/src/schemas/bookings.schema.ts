import { z } from "zod";

export const createBookingSchema = z.object({
  propertyId: z.string().min(1),
  checkIn: z.coerce.date(),
  checkOut: z.coerce.date(),
  moveInDate: z.coerce.date().optional(),
  notes: z.string().max(1000).optional()
});

export const bookingIdParamsSchema = z.object({
  id: z.string().min(1)
});

export const bookingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
