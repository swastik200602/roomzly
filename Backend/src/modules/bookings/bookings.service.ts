import { BookingStatus, NotificationType, UserRole } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { badRequest, forbidden, notFound } from "@/lib/app-error.js";
import { prisma } from "@/lib/prisma.js";
import { notificationService } from "@/modules/notifications/notifications.service.js";
import { emitToUser } from "@/socket/socket.js";
import type { CreateBookingInput } from "@/schemas/bookings.schema.js";

function nightsBetween(checkIn: Date, checkOut: Date): number {
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  if (nights <= 0) throw badRequest("checkOut must be after checkIn");
  return nights;
}

export const bookingService = {
  async list(user: Express.AuthUser, page: number, limit: number) {
    const where =
      user.role === UserRole.ADMIN
        ? {}
        : user.role === UserRole.OWNER
          ? { property: { ownerId: user.id } }
          : { guestId: user.id };
    const [data, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: { property: { select: { id: true, title: true, city: true, ownerId: true } }, guest: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.booking.count({ where })
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async create(guestId: string, input: CreateBookingInput) {
    const property = await prisma.property.findFirst({
      where: { id: input.propertyId, active: true },
      select: { id: true, title: true, ownerId: true, price: true }
    });
    if (!property) throw notFound("Property not found");
    if (property.ownerId === guestId) throw forbidden("Owners cannot book their own property");

    const nights = nightsBetween(input.checkIn, input.checkOut);
    const total = new Prisma.Decimal(property.price).mul(nights);

    const booking = await prisma.$transaction(async (tx) => {
      const overlap = await tx.booking.findFirst({
        where: {
          propertyId: property.id,
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          checkIn: { lt: input.checkOut },
          checkOut: { gt: input.checkIn }
        }
      });
      if (overlap) throw badRequest("Property is unavailable for those dates");

      const created = await tx.booking.create({
        data: {
          propertyId: property.id,
          guestId,
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          moveInDate: input.moveInDate,
          nights,
          total,
          notes: input.notes
        },
        include: { property: true, guest: { select: { id: true, firstName: true, lastName: true, email: true } } }
      });
      await tx.messageThread.create({
        data: {
          propertyId: property.id,
          bookingId: created.id,
          participants: {
            createMany: {
              data: [{ userId: guestId }, { userId: property.ownerId }],
              skipDuplicates: true
            }
          }
        }
      });
      return tx.booking.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          property: true,
          guest: { select: { id: true, firstName: true, lastName: true, email: true } },
          thread: true
        }
      });
    });

    await notificationService.create({
      userId: property.ownerId,
      type: NotificationType.BOOKING,
      title: "New booking request",
      body: `${booking.guest.firstName} requested ${property.title}`,
      metadata: { bookingId: booking.id }
    });
    emitToUser(property.ownerId, "new_booking", booking);
    return booking;
  },

  async confirm(user: Express.AuthUser, id: string) {
    const booking = await prisma.booking.findUnique({ where: { id }, include: { property: true } });
    if (!booking) throw notFound("Booking not found");
    if (user.role !== UserRole.ADMIN && booking.property.ownerId !== user.id) throw forbidden();
    const updated = await prisma.booking.update({ where: { id }, data: { status: BookingStatus.CONFIRMED } });
    await notificationService.create({
      userId: booking.guestId,
      type: NotificationType.BOOKING,
      title: "Booking confirmed",
      body: `${booking.property.title} has been confirmed`,
      metadata: { bookingId: booking.id, propertyId: booking.propertyId }
    });
    emitToUser(booking.guestId, "booking_confirmed", updated);
    return updated;
  },

  async cancel(user: Express.AuthUser, id: string) {
    const booking = await prisma.booking.findUnique({ where: { id }, include: { property: true } });
    if (!booking) throw notFound("Booking not found");
    const canCancel = user.role === UserRole.ADMIN || booking.guestId === user.id || booking.property.ownerId === user.id;
    if (!canCancel) throw forbidden();
    const updated = await prisma.booking.update({ where: { id }, data: { status: BookingStatus.CANCELLED } });
    const recipientIds = new Set([booking.guestId, booking.property.ownerId]);
    recipientIds.delete(user.id);
    await Promise.all(
      Array.from(recipientIds).map((userId) =>
        notificationService.create({
          userId,
          type: NotificationType.BOOKING,
          title: "Booking cancelled",
          body: `${booking.property.title} booking was cancelled`,
          metadata: { bookingId: booking.id, propertyId: booking.propertyId }
        })
      )
    );
    emitToUser(booking.guestId, "booking_cancelled", updated);
    emitToUser(booking.property.ownerId, "booking_cancelled", updated);
    return updated;
  },

  async exportCsv(user: Express.AuthUser) {
    const where =
      user.role === UserRole.ADMIN
        ? {}
        : user.role === UserRole.OWNER
          ? { property: { ownerId: user.id } }
          : { guestId: user.id };
    const rows = await prisma.booking.findMany({
      where,
      include: { property: true, guest: true },
      orderBy: { createdAt: "desc" }
    });
    const escape = (value: string): string => `"${value.replaceAll('"', '""').replace(/^[=+\-@]/, "'$&")}"`;
    return [
      "ID,Guest,Property,Check-in,Check-out,Nights,Total,Status",
      ...rows.map((b) =>
        [
          b.id,
          `${b.guest.firstName} ${b.guest.lastName}`,
          b.property.title,
          b.checkIn.toISOString(),
          b.checkOut.toISOString(),
          String(b.nights),
          b.total.toString(),
          b.status
        ]
          .map(escape)
          .join(",")
      )
    ].join("\n");
  }
};
