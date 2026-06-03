import { AdminAuditAction, BookingStatus, Prisma, ReportStatus, UserRole, VerificationStatus } from "@prisma/client";
import { badRequest, forbidden } from "@/lib/app-error.js";
import { prisma } from "@/lib/prisma.js";
import { adminAuditService, type AuditRequestContext } from "@/modules/admin/admin-audit.service.js";
import { notificationService } from "@/modules/notifications/notifications.service.js";
import { uploadService } from "@/modules/uploads/uploads.service.js";
import type {
  AdminAuditLogQueryInput,
  AdminBookingQueryInput,
  AdminPropertyQueryInput,
  AdminReportQueryInput,
  AdminReviewVerificationDocumentInput,
  AdminUpdateReportInput,
  AdminUpdatePropertyInput,
  AdminUpdateUserInput,
  AdminUserQueryInput
} from "@/schemas/admin.schema.js";

function meta(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

function userSelect() {
  return {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    role: true,
    verified: true,
    active: true,
    avatarUrl: true,
    phone: true,
    phoneNumber: true,
    phoneVerified: true,
    phoneVerifiedAt: true,
    createdAt: true,
    updatedAt: true,
    _count: {
      select: {
        properties: true,
        bookings: true,
        sentMessages: true
      }
    }
  } satisfies Prisma.UserSelect;
}

export const adminService = {
  async overview() {
    const [
      users,
      owners,
      admins,
      activeUsers,
      properties,
      activeProperties,
      pendingBookings,
      confirmedBookings,
      verificationQueue,
      messages,
      revenue,
      reports,
      verifiedOwners,
      verifiedProperties,
      newUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: UserRole.OWNER } }),
      prisma.user.count({ where: { role: UserRole.ADMIN } }),
      prisma.user.count({ where: { active: true } }),
      prisma.property.count(),
      prisma.property.count({ where: { active: true } }),
      prisma.booking.count({ where: { status: BookingStatus.PENDING } }),
      prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
      prisma.verificationDocument.count({ where: { status: VerificationStatus.PENDING } }),
      prisma.message.count(),
      prisma.booking.aggregate({
        where: { status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] } },
        _sum: { total: true }
      }),
      prisma.report.count({ where: { status: { not: ReportStatus.RESOLVED } } }),
      prisma.user.count({ where: { role: UserRole.OWNER, verified: true } }),
      prisma.property.count({ where: { verified: true } }),
      prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } })
    ]);

    return {
      users: { total: users, active: activeUsers, owners, admins, verifiedOwners, new30d: newUsers },
      properties: { total: properties, active: activeProperties, verified: verifiedProperties },
      bookings: { pending: pendingBookings, confirmed: confirmedBookings },
      verificationQueue,
      reports,
      messages,
      revenue: revenue._sum.total?.toString() ?? "0"
    };
  },

  async users(query: AdminUserQueryInput) {
    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.active !== undefined ? { active: query.active } : {}),
      ...(query.phoneVerified !== undefined ? { phoneVerified: query.phoneVerified } : {}),
      ...(query.q
        ? {
            OR: [
              { firstName: { contains: query.q, mode: "insensitive" } },
              { lastName: { contains: query.q, mode: "insensitive" } },
              { email: { contains: query.q, mode: "insensitive" } }
            ]
          }
        : {})
    };
    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelect(),
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit
      }),
      prisma.user.count({ where })
    ]);
    return { data, meta: meta(query.page, query.limit, total) };
  },

  async updateUser(adminId: string, userId: string, input: AdminUpdateUserInput, audit: AuditRequestContext) {
    if (adminId === userId && input.active === false) {
      throw badRequest("You cannot deactivate your own admin account");
    }

    const target = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, active: true, verified: true, phoneVerified: true, role: true, phoneNumber: true }
    });
    if (target.role === UserRole.ADMIN && input.role) {
      throw forbidden("Admin role changes are not allowed from this panel");
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...input,
        ...(input.phoneVerified !== undefined
          ? { phoneVerifiedAt: input.phoneVerified ? new Date() : null }
          : {})
      },
      select: userSelect()
    });
    const action =
      input.active === false
        ? AdminAuditAction.USER_BAN
        : input.active === true
          ? AdminAuditAction.USER_UNBAN
          : input.role
            ? AdminAuditAction.USER_ROLE_CHANGE
            : AdminAuditAction.USER_VERIFICATION;
    await adminAuditService.record({
      ...audit,
      adminId,
      action,
      targetType: "USER",
      targetId: userId,
      previousState: target,
      newState: { active: updated.active, verified: updated.verified, phoneVerified: updated.phoneVerified, role: updated.role }
    });
    return updated;
  },

  async properties(query: AdminPropertyQueryInput) {
    const where: Prisma.PropertyWhereInput = {
      ...(query.active !== undefined ? { active: query.active } : {}),
      ...(query.verified !== undefined ? { verified: query.verified } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: "insensitive" } },
              { city: { contains: query.q, mode: "insensitive" } },
              { address: { contains: query.q, mode: "insensitive" } },
              { owner: { email: { contains: query.q, mode: "insensitive" } } }
            ]
          }
        : {})
    };
    const [data, total] = await Promise.all([
      prisma.property.findMany({
        where,
        select: {
          id: true,
          slug: true,
          code: true,
          title: true,
          city: true,
          category: true,
          price: true,
          verified: true,
          premium: true,
          active: true,
          viewCount: true,
          createdAt: true,
          updatedAt: true,
          owner: { select: { id: true, firstName: true, lastName: true, email: true, verified: true } },
          _count: { select: { images: true, bookings: true, reviews: true } }
        },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit
      }),
      prisma.property.count({ where })
    ]);
    return { data, meta: meta(query.page, query.limit, total) };
  },

  async updateProperty(adminId: string, propertyId: string, input: AdminUpdatePropertyInput, audit: AuditRequestContext) {
    const previous = await prisma.property.findUniqueOrThrow({
      where: { id: propertyId },
      select: { id: true, active: true, verified: true, premium: true }
    });
    const updated = await prisma.property.update({
      where: { id: propertyId },
      data: input,
      select: {
        id: true,
        slug: true,
        code: true,
        title: true,
        city: true,
        category: true,
        price: true,
        verified: true,
        premium: true,
        active: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
        owner: { select: { id: true, firstName: true, lastName: true, email: true, verified: true } },
        _count: { select: { images: true, bookings: true, reviews: true } }
      }
    });
    const action =
      input.active === false
        ? AdminAuditAction.PROPERTY_DELETION
        : input.verified === true
          ? AdminAuditAction.PROPERTY_APPROVAL
          : input.verified === false
            ? AdminAuditAction.PROPERTY_REJECTION
            : input.premium === true
              ? AdminAuditAction.PROPERTY_FEATURE
              : AdminAuditAction.PROPERTY_UNFEATURE;
    await adminAuditService.record({
      ...audit,
      adminId,
      action,
      targetType: "PROPERTY",
      targetId: propertyId,
      previousState: previous,
      newState: { active: updated.active, verified: updated.verified, premium: updated.premium }
    });
    return updated;
  },

  async bookings(query: AdminBookingQueryInput) {
    const where: Prisma.BookingWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { guest: { email: { contains: query.q, mode: "insensitive" } } },
              { guest: { firstName: { contains: query.q, mode: "insensitive" } } },
              { guest: { lastName: { contains: query.q, mode: "insensitive" } } },
              { property: { title: { contains: query.q, mode: "insensitive" } } }
            ]
          }
        : {})
    };
    const [data, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          property: { select: { id: true, title: true, city: true, ownerId: true } },
          guest: { select: { id: true, firstName: true, lastName: true, email: true } }
        },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit
      }),
      prisma.booking.count({ where })
    ]);
    return { data, meta: meta(query.page, query.limit, total) };
  },

  async auditLogs(query: AdminAuditLogQueryInput) {
    const where: Prisma.AdminAuditLogWhereInput = {
      ...(query.action ? { action: query.action } : {}),
      ...(query.targetType ? { targetType: query.targetType } : {}),
      ...(query.q
        ? {
            OR: [
              { targetId: { contains: query.q, mode: "insensitive" } },
              { targetType: { contains: query.q, mode: "insensitive" } },
              { admin: { email: { contains: query.q, mode: "insensitive" } } },
              { admin: { firstName: { contains: query.q, mode: "insensitive" } } },
              { admin: { lastName: { contains: query.q, mode: "insensitive" } } }
            ]
          }
        : {})
    };
    const [data, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        include: { admin: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit
      }),
      prisma.adminAuditLog.count({ where })
    ]);
    return { data, meta: meta(query.page, query.limit, total) };
  },

  async verificationQueue() {
    const documents = await prisma.verificationDocument.findMany({
      where: { status: { in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW, VerificationStatus.RESUBMISSION_REQUESTED] } },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true, verified: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    return documents.map((document) => ({
      ...document,
      fileUrl: uploadService.signedUrl(document.publicId)
    }));
  },

  async propertyVerificationQueue() {
    const documents = await prisma.propertyVerificationDocument.findMany({
      where: { status: { in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW, VerificationStatus.RESUBMISSION_REQUESTED] } },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            slug: true,
            owner: { select: { id: true, firstName: true, lastName: true, email: true, verified: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    return documents.map((document) => ({
      ...document,
      fileUrl: uploadService.signedUrl(document.publicId)
    }));
  },

  async reviewVerificationDocument(
    adminId: string,
    documentId: string,
    input: AdminReviewVerificationDocumentInput,
    audit: AuditRequestContext
  ) {
    const previous = await prisma.verificationDocument.findUniqueOrThrow({
      where: { id: documentId },
      select: { id: true, userId: true, status: true, rejectionReason: true }
    });
    const updated = await prisma.$transaction(async (tx) => {
      const document = await tx.verificationDocument.update({
        where: { id: documentId },
        data: {
          status: input.status,
          rejectionReason: input.rejectionReason ?? null,
          reviewedById: adminId,
          reviewedAt: input.status === VerificationStatus.UNDER_REVIEW ? null : new Date()
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, role: true, verified: true } }
        }
      });
      const verifiedCount = await tx.verificationDocument.count({
        where: { userId: document.userId, status: VerificationStatus.VERIFIED }
      });
      await tx.user.update({
        where: { id: document.userId },
        data: { verified: verifiedCount > 0 || input.status === VerificationStatus.VERIFIED }
      });
      return document;
    });
    const action =
      input.status === VerificationStatus.VERIFIED
        ? AdminAuditAction.VERIFICATION_APPROVAL
        : input.status === VerificationStatus.RESUBMISSION_REQUESTED
          ? AdminAuditAction.VERIFICATION_RESUBMISSION_REQUEST
          : AdminAuditAction.VERIFICATION_REJECTION;
    await adminAuditService.record({
      ...audit,
      adminId,
      action,
      targetType: "VERIFICATION_DOCUMENT",
      targetId: documentId,
      previousState: previous,
      newState: { status: updated.status, rejectionReason: updated.rejectionReason }
    });
    await notificationService.create({
      userId: updated.userId,
      type: "VERIFICATION",
      title: "Identity verification updated",
      body:
        updated.status === VerificationStatus.VERIFIED
          ? "Your owner identity has been approved."
          : updated.rejectionReason ?? `Your verification status is ${updated.status.toLowerCase().replaceAll("_", " ")}.`,
      metadata: { documentId, status: updated.status }
    });
    return updated;
  },

  async reviewPropertyVerificationDocument(
    adminId: string,
    documentId: string,
    input: AdminReviewVerificationDocumentInput,
    audit: AuditRequestContext
  ) {
    const previous = await prisma.propertyVerificationDocument.findUniqueOrThrow({
      where: { id: documentId },
      select: { id: true, propertyId: true, status: true, rejectionReason: true }
    });
    const updated = await prisma.$transaction(async (tx) => {
      const document = await tx.propertyVerificationDocument.update({
        where: { id: documentId },
        data: {
          status: input.status,
          rejectionReason: input.rejectionReason ?? null,
          reviewedById: adminId,
          reviewedAt: input.status === VerificationStatus.UNDER_REVIEW ? null : new Date()
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              slug: true,
              owner: { select: { id: true, firstName: true, lastName: true, email: true, verified: true } }
            }
          }
        }
      });
      const verifiedCount = await tx.propertyVerificationDocument.count({
        where: { propertyId: document.propertyId, status: VerificationStatus.VERIFIED }
      });
      await tx.property.update({
        where: { id: document.propertyId },
        data: { verified: verifiedCount > 0 || input.status === VerificationStatus.VERIFIED }
      });
      return document;
    });
    const action =
      input.status === VerificationStatus.VERIFIED
        ? AdminAuditAction.PROPERTY_APPROVAL
        : input.status === VerificationStatus.RESUBMISSION_REQUESTED
          ? AdminAuditAction.VERIFICATION_RESUBMISSION_REQUEST
          : AdminAuditAction.PROPERTY_REJECTION;
    await adminAuditService.record({
      ...audit,
      adminId,
      action,
      targetType: "PROPERTY_VERIFICATION_DOCUMENT",
      targetId: documentId,
      previousState: previous,
      newState: { status: updated.status, rejectionReason: updated.rejectionReason }
    });
    await notificationService.create({
      userId: updated.property.owner.id,
      type: "VERIFICATION",
      title: "Property verification updated",
      body:
        updated.status === VerificationStatus.VERIFIED
          ? `${updated.property.title} has been verified.`
          : updated.rejectionReason ?? `${updated.property.title} verification is ${updated.status.toLowerCase().replaceAll("_", " ")}.`,
      metadata: { documentId, propertyId: updated.propertyId, status: updated.status }
    });
    return { ...updated, fileUrl: uploadService.signedUrl(updated.publicId) };
  },

  async reports(query: AdminReportQueryInput) {
    const where: Prisma.ReportWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { description: { contains: query.q, mode: "insensitive" } },
              { targetId: { contains: query.q, mode: "insensitive" } },
              { reporter: { email: { contains: query.q, mode: "insensitive" } } }
            ]
          }
        : {})
    };
    const [data, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
          reportedUser: { select: { id: true, firstName: true, lastName: true, email: true } },
          property: { select: { id: true, title: true, slug: true } }
        },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit
      }),
      prisma.report.count({ where })
    ]);
    return { data, meta: meta(query.page, query.limit, total) };
  },

  async updateReport(adminId: string, reportId: string, input: AdminUpdateReportInput, audit: AuditRequestContext) {
    const previous = await prisma.report.findUniqueOrThrow({
      where: { id: reportId },
      select: { id: true, status: true, resolution: true }
    });
    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: input.status,
        resolution: input.resolution ?? null,
        resolvedById: input.status === ReportStatus.RESOLVED ? adminId : null,
        resolvedAt: input.status === ReportStatus.RESOLVED ? new Date() : null
      },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
        reportedUser: { select: { id: true, firstName: true, lastName: true, email: true } },
        property: { select: { id: true, title: true, slug: true } }
      }
    });
    await adminAuditService.record({
      ...audit,
      adminId,
      action: AdminAuditAction.REPORT_RESOLUTION,
      targetType: "REPORT",
      targetId: reportId,
      previousState: previous,
      newState: { status: updated.status, resolution: updated.resolution }
    });
    if (updated.status === ReportStatus.RESOLVED) {
      await notificationService.create({
        userId: updated.reporter.id,
        type: "SYSTEM",
        title: "Report resolved",
        body: updated.resolution ?? "Your report has been reviewed by Roomzly.",
        metadata: { reportId }
      });
    }
    return updated;
  }
};
