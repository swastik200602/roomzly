import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";
import { emitToUser } from "@/socket/socket.js";

type NotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Prisma.InputJsonObject;
};

export const notificationService = {
  async create(input: NotificationInput) {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        metadata: input.metadata ?? Prisma.JsonNull
      }
    });
    emitToUser(input.userId, "new_notification", notification);
    return notification;
  },

  async list(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50
    });
  },

  async unreadCount(userId: string) {
    return { count: await prisma.notification.count({ where: { userId, readAt: null } }) };
  },

  async markRead(userId: string, id: string) {
    await prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() }
    });
    return prisma.notification.findFirstOrThrow({ where: { id, userId } });
  },

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() }
    });
    return { read: true };
  }
};
