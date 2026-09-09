import { BookingStatus, Prisma, PropertyCategory, UserRole } from "@prisma/client";
import crypto from "node:crypto";
import slugify from "slugify";
import { conflict, forbidden, notFound } from "@/lib/app-error.js";
import { prisma } from "@/lib/prisma.js";
import { safeCacheDelete, safeCacheGet, safeCacheSet } from "@/lib/redis.js";
import type {
  CreatePropertyInput,
  CreateReviewInput,
  PropertyVerificationDocumentUploadInput,
  PropertyQueryInput,
  UpdateReviewInput,
  UpdatePropertyInput
} from "@/schemas/properties.schema.js";
import { mapProperty } from "@/modules/properties/properties.mapper.js";
import { uploadService } from "@/modules/uploads/uploads.service.js";
import {
  collegeBounds,
  colleges,
  findCollegeBySearchTerm,
  findCollegeBySlug,
} from "@/modules/properties/colleges.js";

const includeProperty = {
  images: true,
  owner: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      role: true,
      avatarUrl: true,
      verified: true,
      phone: true,
      phoneNumber: true,
      phoneVerified: true
    }
  }
} satisfies Prisma.PropertyInclude;

function normalizeCategory(input: PropertyQueryInput): PropertyCategory | undefined {
  if (input.category) return input.category;
  const cat = input.cat?.toUpperCase();
  if (!cat) return undefined;
  if (cat === "LOFT") return PropertyCategory.LOFT;
  if (cat === "APARTMENT") return PropertyCategory.APARTMENT;
  if (cat === "VILLA") return PropertyCategory.VILLA;
  if (cat === "STUDIO") return PropertyCategory.STUDIO;
  if (cat === "PG") return PropertyCategory.PG;
  if (cat === "COMMERCIAL") return PropertyCategory.COMMERCIAL;
  return undefined;
}

function categoryCode(category: PropertyCategory): string {
  const map: Record<PropertyCategory, string> = {
    APARTMENT: "APT",
    VILLA: "VLA",
    STUDIO: "STD",
    LOFT: "LFT",
    PG: "PG",
    COMMERCIAL: "COM"
  };
  return map[category];
}

async function createUniqueSlug(title: string): Promise<string> {
  const base = slugify(title, { lower: true, strict: true }) || "property";
  const existing = await prisma.property.findMany({
    where: {
      slug: {
        startsWith: base
      }
    },
    select: { slug: true }
  });

  const slugSet = new Set(existing.map((item) => item.slug));
  if (!slugSet.has(base)) return base;

  let suffix = 2;
  while (slugSet.has(`${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}

async function createPropertyCode(category: PropertyCategory): Promise<string> {
  const cat = categoryCode(category);
  for (let attempt = 0; attempt < 5; attempt++) {
    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const candidate = `${cat}-${randomSuffix}`;
    const exists = await prisma.property.findUnique({ where: { code: candidate } });
    if (!exists) return candidate;
  }
  return `${cat}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

function buildWhere(input: PropertyQueryInput): Prisma.PropertyWhereInput {
  const minPrice = input.minPrice ?? input.min;
  const maxPrice = input.maxPrice ?? input.max;
  const category = normalizeCategory(input);
  const college = resolveCollege(input);
  return {
    active: true,
    ...(category ? { category } : {}),
    ...(college ? collegeBounds(college) : {}),
    ...(input.city ? { city: { contains: input.city, mode: "insensitive" } } : {}),
    ...(input.locality ? { locality: { contains: input.locality, mode: "insensitive" } } : {}),
    ...(input.neighborhood ? { neighborhood: { contains: input.neighborhood, mode: "insensitive" } } : {}),
    ...(input.state ? { state: { contains: input.state, mode: "insensitive" } } : {}),
    ...(input.country ? { country: { contains: input.country, mode: "insensitive" } } : {}),
    ...(input.latitude !== undefined && input.longitude !== undefined && input.radiusKm !== undefined
      ? {
          latitude: {
            gte: input.latitude - input.radiusKm / 111,
            lte: input.latitude + input.radiusKm / 111
          },
          longitude: {
            gte: input.longitude - input.radiusKm / (111 * Math.max(Math.cos((input.latitude * Math.PI) / 180), 0.2)),
            lte: input.longitude + input.radiusKm / (111 * Math.max(Math.cos((input.latitude * Math.PI) / 180), 0.2))
          }
        }
      : {}),
    ...(input.premium !== undefined ? { premium: input.premium } : {}),
    ...(input.verified !== undefined ? { verified: input.verified } : {}),
    ...(input.ownerVerified !== undefined ? { owner: { is: { verified: input.ownerVerified } } } : {}),
    ...(input.beds !== undefined ? { beds: { gte: input.beds } } : {}),
    ...(input.amenities.length > 0 ? { amenities: { hasEvery: input.amenities } } : {}),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          price: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {})
          }
        }
      : {}),
    ...(searchText(input)
      ? {
          OR: [
            { title: { contains: searchText(input), mode: "insensitive" } },
            { city: { contains: searchText(input), mode: "insensitive" } },
            { locality: { contains: searchText(input), mode: "insensitive" } },
            { neighborhood: { contains: searchText(input), mode: "insensitive" } },
            { state: { contains: searchText(input), mode: "insensitive" } },
            { country: { contains: searchText(input), mode: "insensitive" } },
            { address: { contains: searchText(input), mode: "insensitive" } },
            { formattedAddress: { contains: searchText(input), mode: "insensitive" } },
            { description: { contains: searchText(input), mode: "insensitive" } }
          ]
        }
      : {})
  };
}

function resolveCollege(input: PropertyQueryInput) {
  return (
    findCollegeBySlug(input.collegeSlug) ??
    findCollegeBySearchTerm(input.college) ??
    ((!input.college && !input.collegeSlug) ? findCollegeBySearchTerm(input.q) : undefined)
  );
}

function searchText(input: PropertyQueryInput) {
  if (!input.q) return undefined;
  const collegeFromQ =
    !input.college &&
    !input.collegeSlug &&
    findCollegeBySearchTerm(input.q);
  return collegeFromQ ? undefined : input.q;
}

async function recalculateRating(tx: Prisma.TransactionClient, propertyId: string) {
  const aggregate = await tx.review.aggregate({
    where: { propertyId },
    _avg: { rating: true },
    _count: { _all: true }
  });
  await tx.property.update({
    where: { id: propertyId },
    data: {
      rating: new Prisma.Decimal(aggregate._avg.rating ?? 0),
      reviewCount: aggregate._count._all
    }
  });
}

function mapReview(review: Prisma.ReviewGetPayload<{ include: { user: { select: { id: true; firstName: true; lastName: true; avatarUrl: true } } } }>) {
  return {
    id: review.id,
    propertyId: review.propertyId,
    userId: review.userId,
    rating: review.rating,
    body: review.body,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    user: {
      id: review.user.id,
      name: `${review.user.firstName} ${review.user.lastName}`,
      initials: `${review.user.firstName[0] ?? ""}${review.user.lastName[0] ?? ""}`.toUpperCase(),
      avatarUrl: review.user.avatarUrl
    }
  };
}

function orderBy(sort: PropertyQueryInput["sort"]): Prisma.PropertyOrderByWithRelationInput[] {
  if (sort === "price-asc") return [{ price: "asc" }];
  if (sort === "price-desc") return [{ price: "desc" }];
  if (sort === "newest") return [{ createdAt: "desc" }];
  if (sort === "popular") return [{ viewCount: "desc" }];
  return [{ premium: "desc" }, { verified: "desc" }, { createdAt: "desc" }];
}

async function recordPropertyView(propertyId: string, source?: string): Promise<void> {
  await Promise.all([
    prisma.property.update({ where: { id: propertyId }, data: { viewCount: { increment: 1 } } }),
    prisma.analyticsEvent.create({
      data: {
        propertyId,
        eventType: "PROPERTY_VIEW",
        source: source ?? "Direct"
      }
    })
  ]);
}

function sortMappedProperties(
  items: ReturnType<typeof mapProperty>[],
  sort: PropertyQueryInput["sort"],
  preferredCollegeSlug?: string,
) {
  return [...items].sort((left, right) => {
    if (preferredCollegeSlug) {
      const leftPrimary = left.primaryCollege?.collegeSlug === preferredCollegeSlug ? left.primaryCollege : null;
      const rightPrimary = right.primaryCollege?.collegeSlug === preferredCollegeSlug ? right.primaryCollege : null;
      if (leftPrimary && rightPrimary) {
        if (sort === "price-asc") return left.price - right.price;
        if (sort === "price-desc") return right.price - left.price;
        if (sort === "newest") {
          return new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime();
        }
        if (sort === "popular") return (right.viewCount ?? 0) - (left.viewCount ?? 0);

        if (right.popularAmongStudents !== left.popularAmongStudents) {
          return Number(right.popularAmongStudents) - Number(left.popularAmongStudents);
        }
        if ((right.studentFriendlyScore ?? 0) !== (left.studentFriendlyScore ?? 0)) {
          return (right.studentFriendlyScore ?? 0) - (left.studentFriendlyScore ?? 0);
        }
        if (leftPrimary.verifiedNearCampus !== rightPrimary.verifiedNearCampus) {
          return Number(rightPrimary.verifiedNearCampus) - Number(leftPrimary.verifiedNearCampus);
        }
        if (leftPrimary.distanceKm !== rightPrimary.distanceKm) {
          return leftPrimary.distanceKm - rightPrimary.distanceKm;
        }
      }
    }

    if (sort === "price-asc") return left.price - right.price;
    if (sort === "price-desc") return right.price - left.price;
    if (sort === "newest") {
      return new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime();
    }
    if (sort === "popular") return (right.viewCount ?? 0) - (left.viewCount ?? 0);
    if (Number(Boolean(right.premium)) !== Number(Boolean(left.premium))) {
      return Number(Boolean(right.premium)) - Number(Boolean(left.premium));
    }
    if (Number(right.verified) !== Number(left.verified)) {
      return Number(right.verified) - Number(left.verified);
    }
    return new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime();
  });
}

export const propertyService = {
  async list(input: PropertyQueryInput) {
    const cacheKey = `properties:list:${crypto.createHash("sha1").update(JSON.stringify(input)).digest("hex")}`;
    const cached = await safeCacheGet(cacheKey);
    if (cached) return JSON.parse(cached) as unknown;

    const where = buildWhere(input);
    const college = resolveCollege(input);

    if (college || input.studentFriendly) {
      const items = await prisma.property.findMany({
        where,
        include: includeProperty,
        take: 200,
      });
      const mapped = items.map((item) => mapProperty(item, college?.slug));
      const collegeFiltered = college
        ? mapped.filter((item) => item.primaryCollege?.collegeSlug === college.slug)
        : mapped.filter((item) => item.primaryCollege);
      const trustFiltered = input.studentFriendly
        ? collegeFiltered.filter((item) => (item.studentFriendlyScore ?? 0) >= 70)
        : collegeFiltered;
      const sorted = sortMappedProperties(trustFiltered, input.sort, college?.slug);
      const total = sorted.length;
      const sliced = sorted.slice((input.page - 1) * input.limit, input.page * input.limit);
      const result = {
        data: sliced,
        meta: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / input.limit)),
          college: college
            ? {
                slug: college.slug,
                name: college.name,
                shortName: college.shortName,
                areaName: college.areaName,
              }
            : undefined,
        },
      };
      await safeCacheSet(cacheKey, JSON.stringify(result), 5 * 60);
      return result;
    }

    const [items, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: includeProperty,
        orderBy: orderBy(input.sort),
        skip: (input.page - 1) * input.limit,
        take: input.limit
      }),
      prisma.property.count({ where })
    ]);
    const result = {
      data: items.map((item) => mapProperty(item)),
      meta: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit),
      }
    };
    await safeCacheSet(cacheKey, JSON.stringify(result), 5 * 60);
    return result;
  },

  async batch(ids: string[]) {
    const items = await prisma.property.findMany({
      where: { id: { in: ids }, active: true },
      include: includeProperty
    });
    const order = new Map(ids.map((id, index) => [id, index]));
    return items
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      .map((item) => mapProperty(item));
  },

  async facets() {
    const [categories, cities, totals] = await Promise.all([
      prisma.property.groupBy({
        by: ["category"],
        where: { active: true },
        _count: { _all: true }
      }),
      prisma.property.groupBy({
        by: ["city"],
        where: { active: true },
        _count: { _all: true },
        orderBy: { _count: { city: "desc" } },
        take: 8
      }),
      Promise.all([
        prisma.property.count({ where: { active: true } }),
        prisma.property.count({ where: { active: true, premium: true } }),
        prisma.property.count({ where: { active: true, verified: true } })
      ])
    ]);

    return {
      total: totals[0],
      premium: totals[1],
      verified: totals[2],
      categories: categories.map((item) => ({
        key: item.category.toLowerCase(),
        category: item.category,
        count: item._count._all
      })),
      cities: cities.map((item) => ({
        name: item.city,
        count: item._count._all
      })),
      colleges: colleges.map((college) => ({
        slug: college.slug,
        name: college.name,
        shortName: college.shortName,
        areaName: college.areaName,
        locality: college.locality,
        latitude: college.latitude,
        longitude: college.longitude,
      })),
    };
  },

  async detail(slug: string, source?: string) {
    const cacheKey = `properties:detail:${slug}`;
    const cached = await safeCacheGet(cacheKey);
    if (cached) {
      const result = JSON.parse(cached) as { id?: string };
      if (result.id) void recordPropertyView(result.id, source).catch(() => undefined);
      return result;
    }

    const property = await prisma.property.findFirst({
      where: { slug, active: true },
      include: includeProperty
    });
    if (!property) throw notFound("Property not found");
    void recordPropertyView(property.id, source).catch(() => undefined);
    const result = mapProperty(property);
    await safeCacheSet(cacheKey, JSON.stringify(result), 10 * 60);
    return result;
  },

  async ownerListings(ownerId: string) {
    const items = await prisma.property.findMany({
      where: { ownerId, active: true },
      include: includeProperty,
      orderBy: { createdAt: "desc" }
    });
    return items.map((item) => mapProperty(item));
  },

  async create(ownerId: string, input: CreatePropertyInput) {
    const [slug, code] = await Promise.all([createUniqueSlug(input.title), createPropertyCode(input.category)]);
    const property = await prisma.property.create({
      data: {
        ...input,
        slug,
        code,
        ownerId,
        price: new Prisma.Decimal(input.price),
        baths: new Prisma.Decimal(input.baths)
      },
      include: includeProperty
    });
    await safeCacheDelete("properties:list:*");
    return mapProperty(property);
  },

  async update(user: Express.AuthUser, id: string, input: UpdatePropertyInput) {
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) throw notFound("Property not found");
    if (user.role !== UserRole.ADMIN && property.ownerId !== user.id) throw forbidden();

    const updated = await prisma.property.update({
      where: { id },
      data: {
        ...input,
        ...(input.price !== undefined ? { price: new Prisma.Decimal(input.price) } : {}),
        ...(input.baths !== undefined ? { baths: new Prisma.Decimal(input.baths) } : {})
      },
      include: includeProperty
    });
    await Promise.all([safeCacheDelete(`properties:detail:${updated.slug}`), safeCacheDelete("properties:list:*")]);
    return mapProperty(updated);
  },

  async softDelete(user: Express.AuthUser, id: string) {
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) throw notFound("Property not found");
    if (user.role !== UserRole.ADMIN && property.ownerId !== user.id) throw forbidden();
    await prisma.property.update({ where: { id }, data: { active: false } });
    await Promise.all([safeCacheDelete(`properties:detail:${property.slug}`), safeCacheDelete("properties:list:*")]);
    return { deleted: true };
  },

  async addImages(user: Express.AuthUser, id: string, files: Express.Multer.File[]) {
    const property = await prisma.property.findUnique({ where: { id }, include: { images: true } });
    if (!property) throw notFound("Property not found");
    if (user.role !== UserRole.ADMIN && property.ownerId !== user.id) throw forbidden();
    if (property.images.length + files.length > 10) throw forbidden("A property can have at most 10 images");

    const uploaded = await uploadService.images(user.id, files, id);
    const startOrder = property.images.length;
    await prisma.propertyImage.createMany({
      data: uploaded.map((image, index) => ({
        propertyId: id,
        url: image.url,
        publicId: image.publicId,
        order: startOrder + index
      }))
    });
    const updated = await prisma.property.findUniqueOrThrow({ where: { id }, include: includeProperty });
    await Promise.all([safeCacheDelete(`properties:detail:${updated.slug}`), safeCacheDelete("properties:list:*")]);
    return mapProperty(updated);
  },

  async deleteImage(user: Express.AuthUser, id: string, imageId: string) {
    const image = await prisma.propertyImage.findUnique({ where: { id: imageId }, include: { property: true } });
    if (!image || image.propertyId !== id) throw notFound("Image not found");
    if (user.role !== UserRole.ADMIN && image.property.ownerId !== user.id) throw forbidden();
    await prisma.propertyImage.delete({ where: { id: imageId } });
    await uploadService.destroy(image.publicId).catch(() => undefined);
    await Promise.all([safeCacheDelete(`properties:detail:${image.property.slug}`), safeCacheDelete("properties:list:*")]);
    return { deleted: true };
  },

  async verificationDocuments(user: Express.AuthUser, id: string) {
    const property = await prisma.property.findUnique({ where: { id }, select: { ownerId: true } });
    if (!property) throw notFound("Property not found");
    if (user.role !== UserRole.ADMIN && property.ownerId !== user.id) throw forbidden();
    const documents = await prisma.propertyVerificationDocument.findMany({
      where: { propertyId: id },
      orderBy: { createdAt: "desc" }
    });
    return documents.map(({ publicId: _publicId, fileUrl: _fileUrl, ...document }) => ({ ...document, fileUrl: "" }));
  },

  async uploadVerificationDocument(
    user: Express.AuthUser,
    id: string,
    input: PropertyVerificationDocumentUploadInput,
    file: Express.Multer.File
  ) {
    const property = await prisma.property.findUnique({ where: { id }, select: { ownerId: true } });
    if (!property) throw notFound("Property not found");
    if (user.role !== UserRole.ADMIN && property.ownerId !== user.id) throw forbidden();
    const upload = await uploadService.propertyVerificationDocument(user.id, id, file);
    const document = await prisma.propertyVerificationDocument.create({
      data: {
        propertyId: id,
        type: input.type,
        fileUrl: upload.url,
        publicId: upload.publicId
      }
    });
    const { publicId: _publicId, fileUrl: _fileUrl, ...safeDocument } = document;
    return { ...safeDocument, fileUrl: "" };
  },

  async listReviews(slug: string) {
    const property = await prisma.property.findFirst({
      where: { slug, active: true },
      select: { id: true }
    });
    if (!property) throw notFound("Property not found");
    const reviews = await prisma.review.findMany({
      where: { propertyId: property.id },
      include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" }
    });
    return reviews.map(mapReview);
  },

  async createReview(user: Express.AuthUser, propertyId: string, input: CreateReviewInput) {
    const property = await prisma.property.findFirst({
      where: { id: propertyId, active: true },
      select: { id: true, ownerId: true, slug: true }
    });
    if (!property) throw notFound("Property not found");
    if (property.ownerId === user.id) throw forbidden("Owners cannot review their own property");

    const eligibleBooking = await prisma.booking.findFirst({
      where: {
        propertyId,
        guestId: user.id,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] }
      },
      select: { id: true }
    });
    if (!eligibleBooking && user.role !== UserRole.ADMIN) {
      throw forbidden("Only confirmed guests can review this property");
    }

    const existing = await prisma.review.findUnique({
      where: { propertyId_userId: { propertyId, userId: user.id } },
      select: { id: true }
    });
    if (existing) throw conflict("You have already reviewed this property");

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          propertyId,
          userId: user.id,
          rating: input.rating,
          body: input.body
        },
        include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } }
      });
      await recalculateRating(tx, propertyId);
      return created;
    });
    await Promise.all([safeCacheDelete("properties:list:*"), safeCacheDelete(`properties:detail:${property.slug}`)]);
    return mapReview(review);
  },

  async updateReview(user: Express.AuthUser, propertyId: string, reviewId: string, input: UpdateReviewInput) {
    const review = await prisma.review.findUnique({ where: { id: reviewId }, include: { property: { select: { slug: true } } } });
    if (!review || review.propertyId !== propertyId) throw notFound("Review not found");
    if (user.role !== UserRole.ADMIN && review.userId !== user.id) throw forbidden();

    const updated = await prisma.$transaction(async (tx) => {
      const saved = await tx.review.update({
        where: { id: reviewId },
        data: input,
        include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } }
      });
      await recalculateRating(tx, propertyId);
      return saved;
    });
    await Promise.all([safeCacheDelete("properties:list:*"), safeCacheDelete(`properties:detail:${review.property.slug}`)]);
    return mapReview(updated);
  },

  async deleteReview(user: Express.AuthUser, propertyId: string, reviewId: string) {
    const review = await prisma.review.findUnique({ where: { id: reviewId }, include: { property: { select: { slug: true } } } });
    if (!review || review.propertyId !== propertyId) throw notFound("Review not found");
    if (user.role !== UserRole.ADMIN && review.userId !== user.id) throw forbidden();

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: reviewId } });
      await recalculateRating(tx, propertyId);
    });
    await Promise.all([safeCacheDelete("properties:list:*"), safeCacheDelete(`properties:detail:${review.property.slug}`)]);
    return { deleted: true };
  }
};
