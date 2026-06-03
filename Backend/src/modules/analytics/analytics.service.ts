import { BookingStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";
import { safeCacheGet, safeCacheSet } from "@/lib/redis.js";
import { forbidden } from "@/lib/app-error.js";

function assertOwner(user: Express.AuthUser): void {
  if (user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN) throw forbidden();
}

function monthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export const analyticsService = {
  async overview(user: Express.AuthUser) {
    assertOwner(user);
    const cacheKey = `analytics:overview:${user.id}`;
    const cached = await safeCacheGet(cacheKey);
    if (cached) return JSON.parse(cached) as unknown;

    const where = user.role === UserRole.ADMIN ? {} : { property: { ownerId: user.id } };
    const [revenue, views, saves, inquiries] = await Promise.all([
      prisma.booking.aggregate({
        where: { ...where, status: BookingStatus.CONFIRMED },
        _sum: { total: true }
      }),
      prisma.property.aggregate({
        where: user.role === UserRole.ADMIN ? {} : { ownerId: user.id },
        _sum: { viewCount: true }
      }),
      prisma.wishlist.count({
        where: user.role === UserRole.ADMIN ? {} : { property: { ownerId: user.id } }
      }),
      prisma.messageThread.count({
        where: user.role === UserRole.ADMIN ? {} : { property: { ownerId: user.id } }
      })
    ]);
    const result = {
      totalRevenue: Number(revenue._sum.total ?? 0),
      totalViews: views._sum.viewCount ?? 0,
      totalSaves: saves,
      totalInquiries: inquiries
    };
    await safeCacheSet(cacheKey, JSON.stringify(result), 60 * 60);
    return result;
  },

  async revenue(user: Express.AuthUser) {
    assertOwner(user);
    const now = monthStart(new Date());
    const months = Array.from({ length: 12 }, (_unused, index) => {
      const date = new Date(now);
      date.setUTCMonth(now.getUTCMonth() - (11 - index));
      return date;
    });
    const where = user.role === UserRole.ADMIN ? {} : { property: { ownerId: user.id } };
    const bookings = await prisma.booking.findMany({
      where: { ...where, status: BookingStatus.CONFIRMED, checkIn: { gte: months[0] } },
      select: { checkIn: true, total: true }
    });
    return months.map((month) => {
      const next = new Date(month);
      next.setUTCMonth(month.getUTCMonth() + 1);
      const total = bookings
        .filter((booking) => booking.checkIn >= month && booking.checkIn < next)
        .reduce((sum, booking) => sum + Number(booking.total), 0);
      return { month: month.toISOString().slice(0, 7), total };
    });
  },

  async topProperties(user: Express.AuthUser) {
    assertOwner(user);
    return prisma.property.findMany({
      where: user.role === UserRole.ADMIN ? {} : { ownerId: user.id },
      select: { id: true, title: true, slug: true, viewCount: true, price: true },
      orderBy: [{ viewCount: "desc" }],
      take: 10
    });
  },

  async traffic(user: Express.AuthUser) {
    assertOwner(user);
    const where =
      user.role === UserRole.ADMIN
        ? { eventType: "PROPERTY_VIEW" }
        : { eventType: "PROPERTY_VIEW", property: { ownerId: user.id } };
    const rows = await prisma.analyticsEvent.groupBy({
      by: ["source"],
      where,
      _count: { _all: true },
      orderBy: { _count: { source: "desc" } }
    });
    const total = rows.reduce((sum, row) => sum + row._count._all, 0);
    if (total === 0) return [];
    return rows.map((row) => ({
      source: row.source ?? "Direct",
      count: row._count._all,
      percentage: Math.round((row._count._all / total) * 100)
    }));
  }
};
