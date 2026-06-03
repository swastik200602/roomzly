import type { Prisma } from "@prisma/client";

type PropertyWithRelations = Prisma.PropertyGetPayload<{
  include: {
    images: true;
    owner: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        role: true;
        avatarUrl: true;
        verified: true;
        phone: true;
        phoneNumber: true;
        phoneVerified: true;
      };
    };
  };
}>;

function categoryToFrontend(category: PropertyWithRelations["category"]) {
  return category.toLowerCase();
}

function categoryLabel(category: PropertyWithRelations["category"]) {
  const labels = {
    APARTMENT: "Apartment",
    VILLA: "Villa",
    STUDIO: "Studio",
    LOFT: "Co-living",
    PG: "PG / Hostel",
    COMMERCIAL: "Commercial"
  } as const;
  return labels[category];
}

function furnishingToFrontend(furnishing: PropertyWithRelations["furnishing"]) {
  const labels = {
    FURNISHED: "Furnished",
    SEMI_FURNISHED: "Semi-furnished",
    UNFURNISHED: "Unfurnished"
  } as const;
  return labels[furnishing];
}

export function mapProperty(property: PropertyWithRelations) {
  return {
    id: property.id,
    slug: property.slug,
    code: property.code,
    title: property.title,
    description: property.description,
    city: property.city,
    neighborhood: property.neighborhood,
    locality: property.locality,
    state: property.state,
    country: property.country,
    address: property.address,
    formattedAddress: property.formattedAddress,
    latitude: property.latitude,
    longitude: property.longitude,
    category: categoryToFrontend(property.category),
    categoryLabel: categoryLabel(property.category),
    price: Number(property.price),
    priceUnit: "per month",
    beds: property.beds,
    baths: Number(property.baths),
    sqft: property.sqft,
    amenities: property.amenities,
    furnishing: furnishingToFrontend(property.furnishing),
    verified: property.verified,
    premium: property.premium,
    active: property.active,
    rating: Number(property.rating),
    reviews: property.reviewCount,
    reviewCount: property.reviewCount,
    viewCount: property.viewCount,
    images: property.images
      .sort((a, b) => a.order - b.order)
      .map((image) => ({ id: image.id, url: image.url, order: image.order })),
    image: property.images.sort((a, b) => a.order - b.order)[0]?.url ?? null,
    gallery: property.images.sort((a, b) => a.order - b.order).map((image) => image.url),
    owner: {
      id: property.owner.id,
      name: `${property.owner.firstName} ${property.owner.lastName}`,
      initials: `${property.owner.firstName[0] ?? ""}${property.owner.lastName[0] ?? ""}`.toUpperCase(),
      role: property.owner.verified ? "Verified owner" : "Owner",
      avatarUrl: property.owner.avatarUrl,
      phone: property.owner.phone,
      phoneNumber: property.owner.phoneNumber,
      phoneVerified: property.owner.phoneVerified,
      responseRate: 95
    },
    createdAt: property.createdAt,
    updatedAt: property.updatedAt
  };
}
