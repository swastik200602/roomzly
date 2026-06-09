import { apiFetch, apiRequest, apiRequestEnvelope } from "@/lib/api/client";

export type Booking = {
  id: string;
  propertyId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: string | number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  moveInDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    title: string;
    city: string;
    ownerId: string;
  };
  guest: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  thread?: {
    id: string;
    propertyId?: string | null;
    bookingId?: string | null;
  } | null;
};

export type PaginatedBookings = {
  data: Booking[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const bookingsApi = {
  async list(params: { page?: number; limit?: number } = {}): Promise<PaginatedBookings> {
    const search = new URLSearchParams();
    if (params.page) search.set("page", String(params.page));
    if (params.limit) search.set("limit", String(params.limit));
    const suffix = search.toString() ? `?${search.toString()}` : "";
    const envelope = await apiRequestEnvelope<Booking[]>(`/bookings${suffix}`);
    return {
      data: envelope.data,
      meta: envelope.meta as PaginatedBookings["meta"],
    };
  },

  create(payload: { propertyId: string; checkIn: string; checkOut: string; moveInDate?: string; notes?: string }) {
    return apiRequest<Booking>("/bookings", {
      method: "POST",
      body: payload,
    });
  },

  confirm(id: string) {
    return apiRequest<Booking>(`/bookings/${id}/confirm`, {
      method: "PATCH",
    });
  },

  cancel(id: string) {
    return apiRequest<Booking>(`/bookings/${id}/cancel`, {
      method: "PATCH",
    });
  },

  async exportCsv() {
    const response = await apiFetch("/bookings/export");
    if (!response.ok) throw new Error("Booking export failed");
    return response.blob();
  },
};
