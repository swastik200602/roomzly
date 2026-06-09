import { apiRequest, apiRequestEnvelope } from "@/lib/api/client";
import type { Booking } from "@/lib/api/bookings";
import type { UserRole } from "@/lib/api/auth";

type Meta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminOverview = {
  users: { total: number; active: number; owners: number; admins: number; verifiedOwners?: number; new30d?: number };
  properties: { total: number; active: number; verified?: number };
  bookings: { pending: number; confirmed: number };
  verificationQueue: number;
  reports?: number;
  messages: number;
  revenue: string;
};

export type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  verified: boolean;
  active: boolean;
  avatarUrl?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  phoneVerified: boolean;
  phoneVerifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    properties: number;
    bookings: number;
    sentMessages: number;
  };
};

export type AdminProperty = {
  id: string;
  slug: string;
  code: string;
  title: string;
  city: string;
  category: string;
  price: string | number;
  verified: boolean;
  premium: boolean;
  active: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    verified: boolean;
  };
  _count: {
    images: number;
    bookings: number;
    reviews: number;
  };
};

export type PaginatedAdmin<T> = {
  data: T[];
  meta: Meta;
};

export type AdminAuditLog = {
  id: string;
  adminId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  previousState?: unknown;
  newState?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  admin?: { id: string; firstName: string; lastName: string; email: string } | null;
};

export type AdminVerificationDocument = {
  id: string;
  userId: string;
  type: string;
  status: "MISSING" | "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | "RESUBMISSION_REQUESTED";
  fileUrl: string;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  user?: { id: string; firstName: string; lastName: string; email: string; role?: string; verified: boolean };
  property?: {
    id: string;
    title: string;
    slug: string;
    owner: { id: string; firstName: string; lastName: string; email: string; verified: boolean };
  };
};

export type AdminReport = {
  id: string;
  targetType: string;
  targetId: string;
  type: string;
  status: "PENDING" | "INVESTIGATING" | "RESOLVED";
  description: string;
  resolution?: string | null;
  createdAt: string;
  reporter: { id: string; firstName: string; lastName: string; email: string };
  reportedUser?: { id: string; firstName: string; lastName: string; email: string } | null;
  property?: { id: string; title: string; slug: string } | null;
};

function toSearch(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function paginated<T>(path: string): Promise<PaginatedAdmin<T>> {
  const envelope = await apiRequestEnvelope<T[]>(path);
  return {
    data: envelope.data,
    meta: envelope.meta as Meta,
  };
}

export const adminApi = {
  overview() {
    return apiRequest<AdminOverview>("/admin/overview");
  },

  users(params: { q?: string; role?: UserRole; active?: boolean; phoneVerified?: boolean; page?: number; limit?: number } = {}) {
    return paginated<AdminUser>(`/admin/users${toSearch(params)}`);
  },

  updateUser(id: string, payload: { active?: boolean; verified?: boolean; phoneVerified?: boolean; role?: Exclude<UserRole, "ADMIN"> }) {
    return apiRequest<AdminUser>(`/admin/users/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  properties(params: { q?: string; active?: boolean; verified?: boolean; page?: number; limit?: number } = {}) {
    return paginated<AdminProperty>(`/admin/properties${toSearch(params)}`);
  },

  updateProperty(id: string, payload: { active?: boolean; verified?: boolean; premium?: boolean }) {
    return apiRequest<AdminProperty>(`/admin/properties/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  bookings(params: { q?: string; status?: Booking["status"]; page?: number; limit?: number } = {}) {
    return paginated<Booking>(`/admin/bookings${toSearch(params)}`);
  },

  auditLogs(params: { q?: string; action?: string; targetType?: string; page?: number; limit?: number } = {}) {
    return paginated<AdminAuditLog>(`/admin/audit-logs${toSearch(params)}`);
  },

  verificationDocuments() {
    return apiRequest<AdminVerificationDocument[]>("/admin/verification-documents");
  },

  propertyVerificationDocuments() {
    return apiRequest<AdminVerificationDocument[]>("/admin/property-verification-documents");
  },

  reviewVerificationDocument(id: string, payload: { status: AdminVerificationDocument["status"]; rejectionReason?: string }) {
    return apiRequest<AdminVerificationDocument>(`/admin/verification-documents/${id}/review`, {
      method: "PATCH",
      body: payload,
    });
  },

  reviewPropertyVerificationDocument(id: string, payload: { status: AdminVerificationDocument["status"]; rejectionReason?: string }) {
    return apiRequest<AdminVerificationDocument>(`/admin/property-verification-documents/${id}/review`, {
      method: "PATCH",
      body: payload,
    });
  },

  reports(params: { q?: string; status?: AdminReport["status"]; page?: number; limit?: number } = {}) {
    return paginated<AdminReport>(`/admin/reports${toSearch(params)}`);
  },

  updateReport(id: string, payload: { status: AdminReport["status"]; resolution?: string }) {
    return apiRequest<AdminReport>(`/admin/reports/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },
};
