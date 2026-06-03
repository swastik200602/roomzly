import { NotificationType } from "@prisma/client";
import { notFound } from "@/lib/app-error.js";
import { prisma } from "@/lib/prisma.js";
import { mapProperty } from "@/modules/properties/properties.mapper.js";
import { notificationService } from "@/modules/notifications/notifications.service.js";

export const wishlistService = {
  async list(userId: string) {
    const items = await prisma.wishlist.findMany({
      where: { userId },
      include: { property: { include: { images: true, owner: true } } },
      orderBy: { createdAt: "desc" }
    });
    return items.map((item) => ({
      id: item.id,
      propertyId: item.propertyId,
      createdAt: item.createdAt,
      property: mapProperty(item.property)
    }));
  },

  async add(userId: string, propertyId: string) {
    const property = await prisma.property.findFirst({
      where: { id: propertyId, active: true },
      select: { id: true, ownerId: true, title: true }
    });
    if (!property) throw notFound("Property not found");
    const existing = await prisma.wishlist.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
      select: { id: true }
    });
    const saved = await prisma.wishlist.upsert({
      where: { userId_propertyId: { userId, propertyId } },
      update: {},
      create: { userId, propertyId }
    });
    if (!existing && property.ownerId !== userId) {
      await notificationService.create({
        userId: property.ownerId,
        type: NotificationType.WISHLIST,
        title: "Property saved",
        body: `Someone saved ${property.title}`,
        metadata: { propertyId }
      });
    }
    return saved;
  },

  async remove(userId: string, propertyId: string) {
    await prisma.wishlist.deleteMany({ where: { userId, propertyId } });
    return { removed: true };
  },

  async sync(userId: string, propertyIds: string[]) {
    await prisma.$transaction([
      prisma.wishlist.deleteMany({ where: { userId } }),
      prisma.wishlist.createMany({
        data: propertyIds.map((propertyId) => ({ userId, propertyId })),
        skipDuplicates: true
      })
    ]);
    return { synced: true, count: propertyIds.length };
  }
};
