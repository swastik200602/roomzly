import { apiRequest } from "@/lib/api/client";

export type ThreadUser = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
};

export type Message = {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender?: ThreadUser;
  attachments?: MessageAttachment[];
};

export type MessageAttachment = {
  id: string;
  messageId: string;
  url: string;
  resourceType: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export type MessageThread = {
  id: string;
  propertyId?: string | null;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: string;
    title: string;
    slug?: string;
  } | null;
  participants: {
    id: string;
    threadId: string;
    userId: string;
    lastReadAt?: string | null;
    user: ThreadUser;
  }[];
  messages: Message[];
  unreadCount?: number;
};

export const messagesApi = {
  threads() {
    return apiRequest<MessageThread[]>("/messages/threads");
  },

  thread(threadId: string) {
    return apiRequest<MessageThread>(`/messages/threads/${threadId}`);
  },

  createThread(payload: { propertyId: string; participantId?: string }) {
    return apiRequest<MessageThread>("/messages/threads", {
      method: "POST",
      body: payload,
    });
  },

  send(threadId: string, body: string) {
    return apiRequest<Message>(`/messages/threads/${threadId}/messages`, {
      method: "POST",
      body: { body },
    });
  },

  sendWithAttachments(threadId: string, body: string, files: File[]) {
    const form = new FormData();
    form.append("body", body);
    files.forEach((file) => form.append("attachments", file));
    return apiRequest<Message>(`/messages/threads/${threadId}/messages/attachments`, {
      method: "POST",
      body: form,
    });
  },

  markRead(threadId: string) {
    return apiRequest<{ threadId: string; readAt: string }>(`/messages/threads/${threadId}/read`, {
      method: "PATCH",
    });
  },

  deleteThread(threadId: string) {
    return apiRequest<{ deleted: boolean; threadId: string }>(`/messages/threads/${threadId}`, {
      method: "DELETE",
    });
  },
};
