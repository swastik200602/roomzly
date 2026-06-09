import { apiRequest } from "@/lib/api/client";
import type { Property } from "@/lib/properties";

export type WishlistItem = {
  id: string;
  propertyId: string;
  createdAt: string;
  property: Property;
};

export const wishlistApi = {
  list() {
    return apiRequest<WishlistItem[]>("/wishlist");
  },

  add(propertyId: string) {
    return apiRequest<{ id: string; userId: string; propertyId: string; createdAt: string }>(`/wishlist/${propertyId}`, {
      method: "POST",
    });
  },

  remove(propertyId: string) {
    return apiRequest<{ removed: boolean }>(`/wishlist/${propertyId}`, {
      method: "DELETE",
    });
  },

  sync(propertyIds: string[]) {
    return apiRequest<{ synced: boolean; count: number }>("/wishlist/sync", {
      method: "POST",
      body: { propertyIds },
    });
  },
};
