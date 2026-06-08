import { NotificationType } from "@prisma/client";
import { badRequest, forbidden, notFound } from "@/lib/app-error.js";
import { prisma } from "@/lib/prisma.js";
import { notificationService } from "@/modules/notifications/notifications.service.js";
import { uploadService } from "@/modules/uploads/uploads.service.js";
import { emitToThread, emitToUser, emitToUserExceptThread } from "@/socket/socket.js";

async function assertParticipant(threadId: string, userId: string): Promise<void> {
  const participant = await prisma.threadParticipant.findUnique({
    where: { threadId_userId: { threadId, userId } }
  });
  if (!participant) throw forbidden("Thread access denied");
}

function unreadFilter(threadId: string, userId: string, lastReadAt?: Date | null) {
  return {
    threadId,
    senderId: { not: userId },
    ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {})
  };
}

async function decorateThreads<T extends { id: string; participants: { userId: string; lastReadAt: Date | null }[] }>(
  threads: T[],
  userId: string
) {
  return Promise.all(
    threads.map(async (thread) => {
      const membership = thread.participants.find((participant) => participant.userId === userId);
      const unreadCount = await prisma.message.count({
        where: unreadFilter(thread.id, userId, membership?.lastReadAt)
      });
      return { ...thread, unreadCount };
    })
  );
}

function dedupeThreadsByConversation<
  T extends {
    propertyId: string | null;
    updatedAt: Date;
    participants: { userId: string }[];
  }
>(threads: T[]): T[] {
  const byConversation = new Map<string, T>();
  for (const thread of threads) {
    const participantKey = thread.participants
      .map((participant) => participant.userId)
      .sort()
      .join(":");
    const key = `${thread.propertyId ?? "general"}:${participantKey}`;
    const current = byConversation.get(key);
    if (!current || thread.updatedAt > current.updatedAt) {
      byConversation.set(key, thread);
    }
  }
  return [...byConversation.values()].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

function sanitizeMessage<T extends { attachments?: { publicId: string }[] }>(message: T) {
  return {
    ...message,
    attachments: message.attachments?.map(({ publicId: _publicId, ...attachment }) => attachment)
  };
}

function sanitizeThread<T extends { messages: { attachments?: { publicId: string }[] }[] }>(thread: T) {
  return {
    ...thread,
    messages: thread.messages.map(sanitizeMessage)
  };
}

export const messageService = {
  async listThreads(userId: string) {
    const threads = await prisma.messageThread.findMany({
      where: { participants: { some: { userId } } },
      include: {
        property: { select: { id: true, title: true, slug: true } },
        participants: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } },
        messages: { include: { attachments: true }, orderBy: { createdAt: "desc" }, take: 1 }
      },
      orderBy: { updatedAt: "desc" }
    });
    return decorateThreads(dedupeThreadsByConversation(threads).map(sanitizeThread), userId);
  },

  async getThread(userId: string, threadId: string) {
    await assertParticipant(threadId, userId);
    const lastReadAt = new Date();
    await prisma.threadParticipant.update({
      where: { threadId_userId: { threadId, userId } },
      data: { lastReadAt }
    });
    emitToThread(threadId, "messages_read", { threadId, userId, readAt: lastReadAt });
    const thread = await prisma.messageThread.findUniqueOrThrow({
      where: { id: threadId },
      include: {
        property: true,
        participants: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } },
        messages: {
          include: {
            attachments: true,
            sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }
          },
          orderBy: { createdAt: "asc" }
        }
      }
    });
    return { ...sanitizeThread(thread), unreadCount: 0 };
  },

  async createThread(userId: string, propertyId: string, participantId?: string) {
    const property = await prisma.property.findFirst({
      where: { id: propertyId, active: true },
      select: { id: true, ownerId: true }
    });
    if (!property) throw notFound("Property not found");
    const otherUserId = participantId ?? property.ownerId;
    if (otherUserId === userId) {
      throw badRequest("You cannot start a conversation with yourself");
    }

    const existing = await prisma.messageThread.findFirst({
      where: {
        propertyId,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: otherUserId } } }
        ]
      },
      include: {
        property: { select: { id: true, title: true, slug: true } },
        participants: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } },
        messages: { include: { attachments: true }, orderBy: { createdAt: "desc" }, take: 1 }
      },
      orderBy: { updatedAt: "desc" }
    });
    if (existing && existing.participants.length === 2) return { ...(await decorateThreads([existing], userId))[0] };

    const created = await prisma.messageThread.create({
      data: {
        propertyId,
        participants: {
          createMany: {
            data: [{ userId }, { userId: otherUserId }],
            skipDuplicates: true
          }
        }
      },
      include: {
        property: { select: { id: true, title: true, slug: true } },
        participants: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } },
        messages: { include: { attachments: true }, orderBy: { createdAt: "desc" }, take: 1 }
      }
    });
    return { ...(await decorateThreads([created], userId))[0] };
  },

  async sendMessage(userId: string, threadId: string, body: string, files: Express.Multer.File[] = []) {
    await assertParticipant(threadId, userId);
    const trimmedBody = body.trim();
    if (!trimmedBody && files.length === 0) throw badRequest("Message body or attachment is required");
    const uploaded = files.length > 0 ? await uploadService.chatAttachments(userId, threadId, files) : [];
    const message = await prisma.message.create({
      data: {
        threadId,
        senderId: userId,
        body: trimmedBody,
        attachments: {
          create: uploaded
        }
      },
      include: {
        attachments: true,
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }
      }
    });
    await prisma.messageThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });
    const recipients = await prisma.threadParticipant.findMany({
      where: { threadId, userId: { not: userId } },
      select: { userId: true }
    });
    const safeMessage = sanitizeMessage(message);
    emitToThread(threadId, "new_message", safeMessage);
    await Promise.all(
      recipients.map((recipient) =>
        notificationService.create({
          userId: recipient.userId,
          type: NotificationType.MESSAGE,
          title: "New message",
          body: trimmedBody || `${uploaded.length} attachment${uploaded.length === 1 ? "" : "s"}`,
          metadata: { threadId, messageId: message.id }
        })
      )
    );
    recipients.forEach((recipient) => {
      emitToUserExceptThread(recipient.userId, threadId, "new_message", safeMessage);
      emitToUser(recipient.userId, "unread_count_changed", { threadId });
    });
    return safeMessage;
  },

  async markRead(userId: string, threadId: string) {
    await assertParticipant(threadId, userId);
    const readAt = new Date();
    await prisma.threadParticipant.update({
      where: { threadId_userId: { threadId, userId } },
      data: { lastReadAt: readAt }
    });
    emitToThread(threadId, "messages_read", { threadId, userId, readAt });
    return { threadId, readAt };
  },

  async deleteThread(userId: string, threadId: string) {
    await assertParticipant(threadId, userId);
    const [participants, attachments] = await Promise.all([
      prisma.threadParticipant.findMany({
        where: { threadId },
        select: { userId: true }
      }),
      prisma.messageAttachment.findMany({
        where: { message: { threadId } },
        select: { publicId: true, resourceType: true }
      })
    ]);
    await prisma.messageThread.delete({ where: { id: threadId } });
    await Promise.all(
      attachments.map((attachment) =>
        uploadService
          .destroyResource(attachment.publicId, attachment.resourceType === "raw" ? "raw" : "image")
          .catch(() => undefined)
      )
    );
    participants.forEach((participant) => {
      emitToUser(participant.userId, "thread_deleted", { threadId, deletedBy: userId });
    });
    return { deleted: true, threadId };
  },

  async canAccessThread(userId: string, threadId: string) {
    const participant = await prisma.threadParticipant.findUnique({
      where: { threadId_userId: { threadId, userId } },
      select: { id: true }
    });
    return Boolean(participant);
  }
};
