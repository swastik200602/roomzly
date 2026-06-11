export type PropertyCategory =
  | "apartment"
  | "villa"
  | "studio"
  | "loft"
  | "pg"
  | "commercial";

export interface PropertyImage {
  id: string;
  url: string;
  order: number;
}

export interface PropertyCollegeMatch {
  collegeSlug: string;
  collegeName: string;
  shortName: string;
  areaName: string;
  distanceKm: number;
  walkingMinutes: number;
  drivingMinutes: number;
  studentFriendlyScore: number;
  popularAmongStudents: boolean;
  verifiedNearCampus: boolean;
}

export interface Property {
  id: string;
  slug: string;
  code: string;
  title: string;
  city: string;
  neighborhood?: string | null;
  locality?: string | null;
  state?: string | null;
  country?: string | null;
  address?: string;
  formattedAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  category: PropertyCategory;
  categoryLabel: string;
  price: number;
  priceUnit: string;
  beds: number;
  baths: number;
  sqft: number;
  rating: number;
  reviews: number;
  reviewCount?: number;
  viewCount?: number;
  verified: boolean;
  premium?: boolean;
  active?: boolean;
  primaryCollege?: PropertyCollegeMatch | null;
  nearbyColleges?: PropertyCollegeMatch[];
  studentFriendlyScore?: number | null;
  popularAmongStudents?: boolean;
  image?: string | null;
  images?: PropertyImage[];
  gallery: string[];
  amenities: string[];
  description: string;
  owner: {
    id?: string;
    name: string;
    initials: string;
    role: string;
    verified?: boolean;
    responseRate: number;
    avatarUrl?: string | null;
    phone?: string | null;
    phoneNumber?: string | null;
    phoneVerified?: boolean;
  };
  furnishing: "Furnished" | "Semi-furnished" | "Unfurnished";
  createdAt?: string;
  updatedAt?: string;
}

export const CATEGORIES = [
  { key: "apartment", label: "Apartments", apiValue: "APARTMENT" },
  { key: "villa", label: "Villas", apiValue: "VILLA" },
  { key: "studio", label: "Studios", apiValue: "STUDIO" },
  { key: "loft", label: "Co-living", apiValue: "LOFT" },
  { key: "pg", label: "PG / Hostels", apiValue: "PG" },
  { key: "commercial", label: "Commercial", apiValue: "COMMERCIAL" },
] as const;

export function categoryLabel(key?: string) {
  return CATEGORIES.find((category) => category.key === key)?.label ?? "All properties";
}
