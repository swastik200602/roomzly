import { apiRequest } from "@/lib/api/client";

export type Notification = {
  id: string;
  userId: string;
  type: "BOOKING" | "MESSAGE" | "WISHLIST" | "SYSTEM" | "VERIFICATION";
  title: string;
  body: string;
  readAt?: string | null;
  metadata?: unknown;
  createdAt: string;
};

export const notificationsApi = {
  list() {
    return apiRequest<Notification[]>("/notifications");
  },

  unreadCount() {
    return apiRequest<{ count: number }>("/notifications/unread-count");
  },

  markRead(id: string) {
    return apiRequest<Notification>(`/notifications/${id}/read`, {
      method: "PATCH",
    });
  },

  markAllRead() {
    return apiRequest<{ read: boolean }>("/notifications/read-all", {
      method: "PATCH",
    });
  },
};
