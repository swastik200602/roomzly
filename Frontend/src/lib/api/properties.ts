import type { Property } from "@/lib/properties";
import { apiRequest, apiRequestEnvelope } from "@/lib/api/client";

export type PropertyListParams = {
  q?: string;
  cat?: string;
  city?: string;
  locality?: string;
  neighborhood?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  premium?: number | boolean;
  verified?: number | boolean;
  min?: number;
  max?: number;
  beds?: number;
  amenities?: string[];
  sort?: string;
  page?: number;
  limit?: number;
};

export type PaginatedProperties = {
  data: Property[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type PropertyFacets = {
  total: number;
  premium: number;
  verified: number;
  categories: { key: string; category: string; count: number }[];
  cities: { name: string; count: number }[];
};

export type PropertyReview = {
  id: string;
  propertyId: string;
  userId: string;
  rating: number;
  body: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    initials: string;
    avatarUrl?: string | null;
  };
};

export type PropertyVerificationStatus = "MISSING" | "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | "RESUBMISSION_REQUESTED";

export type PropertyVerificationDocument = {
  id: string;
  propertyId: string;
  type: "OWNERSHIP_DOCUMENT" | "UTILITY_BILL" | "PROPERTY_PROOF";
  status: PropertyVerificationStatus;
  fileUrl: string;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePropertyPayload = {
  title: string;
  description: string;
  city: string;
  locality: string;
  state: string;
  country: string;
  neighborhood?: string;
  address: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  category: "APARTMENT" | "VILLA" | "STUDIO" | "LOFT" | "PG" | "COMMERCIAL";
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  amenities: string[];
  furnishing: "FURNISHED" | "SEMI_FURNISHED" | "UNFURNISHED";
};

function toSearch(params: PropertyListParams) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    if (Array.isArray(value)) {
      if (value.length > 0) search.set(key, value.join(","));
      return;
    }
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const propertiesApi = {
  async list(params: PropertyListParams): Promise<PaginatedProperties> {
    const envelope = await apiRequestEnvelope<Property[]>(`/properties${toSearch(params)}`);
    return {
      data: envelope.data,
      meta: envelope.meta as PaginatedProperties["meta"],
    };
  },

  detail(slug: string) {
    return apiRequest<Property>(`/properties/${slug}`);
  },

  facets() {
    return apiRequest<PropertyFacets>("/properties/meta/facets");
  },

  batch(ids: string[]) {
    return apiRequest<Property[]>("/properties/batch", {
      method: "POST",
      body: { ids },
    });
  },

  ownerListings() {
    return apiRequest<Property[]>("/properties/owner/listings");
  },

  create(payload: CreatePropertyPayload) {
    return apiRequest<Property>("/properties", {
      method: "POST",
      body: payload,
    });
  },

  update(id: string, payload: Partial<CreatePropertyPayload>) {
    return apiRequest<Property>(`/properties/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  remove(id: string) {
    return apiRequest<{ deleted: boolean }>(`/properties/${id}`, {
      method: "DELETE",
    });
  },

  addImages(id: string, files: File[]) {
    const form = new FormData();
    files.forEach((file) => form.append("images", file));
    return apiRequest<Property>(`/properties/${id}/images`, {
      method: "POST",
      body: form,
      timeoutMs: 60000,
    });
  },

  deleteImage(id: string, imageId: string) {
    return apiRequest<{ deleted: boolean }>(`/properties/${id}/images/${imageId}`, {
      method: "DELETE",
    });
  },

  verificationDocuments(id: string) {
    return apiRequest<PropertyVerificationDocument[]>(`/properties/${id}/verification-documents`);
  },

  uploadVerificationDocument(id: string, payload: { type: PropertyVerificationDocument["type"]; file: File }) {
    const form = new FormData();
    form.append("type", payload.type);
    form.append("document", payload.file);
    return apiRequest<PropertyVerificationDocument>(`/properties/${id}/verification-documents`, {
      method: "POST",
      body: form,
      timeoutMs: 60000,
    });
  },

  reviews(slug: string) {
    return apiRequest<PropertyReview[]>(`/properties/${slug}/reviews`);
  },

  createReview(id: string, payload: { rating: number; body: string }) {
    return apiRequest<PropertyReview>(`/properties/${id}/reviews`, {
      method: "POST",
      body: payload,
    });
  },
};
