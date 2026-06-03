import { Furnishing, PropertyCategory, PropertyVerificationDocumentType } from "@prisma/client";
import { z } from "zod";

export const propertyQuerySchema = z.object({
  q: z.string().trim().optional(),
  category: z.nativeEnum(PropertyCategory).optional(),
  cat: z.string().optional(),
  city: z.string().trim().optional(),
  locality: z.string().trim().optional(),
  neighborhood: z.string().trim().optional(),
  state: z.string().trim().optional(),
  country: z.string().trim().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(50).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  min: z.coerce.number().nonnegative().optional(),
  max: z.coerce.number().nonnegative().optional(),
  beds: z.coerce.number().int().nonnegative().optional(),
  amenities: z
    .preprocess((value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === "string") {
        return value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
      return [];
    }, z.array(z.string().min(1).max(80)).max(20))
    .default([]),
  premium: z.coerce.boolean().optional(),
  verified: z.coerce.boolean().optional(),
  sort: z.enum(["featured", "price-asc", "price-desc", "newest", "popular"]).default("featured"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12)
});

const propertyPayloadSchema = z.object({
  title: z.string().min(3).max(180),
  description: z.string().min(20).max(4000),
  city: z.string().min(2).max(120),
  locality: z.string().min(2).max(120),
  state: z.string().min(2).max(120),
  country: z.string().min(2).max(120),
  neighborhood: z.string().max(120).optional(),
  address: z.string().min(4).max(240),
  formattedAddress: z.string().min(8).max(500),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  category: z.nativeEnum(PropertyCategory),
  price: z.coerce.number().positive(),
  beds: z.coerce.number().int().nonnegative(),
  baths: z.coerce.number().nonnegative(),
  sqft: z.coerce.number().int().positive(),
  amenities: z.array(z.string().min(1).max(80)).default([]),
  furnishing: z.nativeEnum(Furnishing)
});

export const createPropertySchema = propertyPayloadSchema.refine((value) => value.formattedAddress.toLowerCase().includes(value.city.toLowerCase()), {
  message: "Formatted address should include the selected city",
  path: ["formattedAddress"]
});

export const updatePropertySchema = propertyPayloadSchema.partial().refine((value) => {
  if (!value.formattedAddress || !value.city) return true;
  return value.formattedAddress.toLowerCase().includes(value.city.toLowerCase());
}, {
  message: "Formatted address should include the selected city",
  path: ["formattedAddress"]
});

export const propertyIdParamsSchema = z.object({
  id: z.string().min(1)
});

export const propertySlugParamsSchema = z.object({
  slug: z.string().min(1)
});

export const propertyBatchSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(50)
});

export const propertyReviewParamsSchema = z.object({
  id: z.string().min(1),
  reviewId: z.string().min(1)
});

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().min(2).max(1200)
});

export const updateReviewSchema = createReviewSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const propertyVerificationDocumentUploadSchema = z.object({
  type: z.nativeEnum(PropertyVerificationDocumentType)
});

export type PropertyQueryInput = z.infer<typeof propertyQuerySchema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type PropertyVerificationDocumentUploadInput = z.infer<typeof propertyVerificationDocumentUploadSchema>;
