import { NotificationType, Prisma, UserRole, VerificationStatus, type User, type VerificationDocument } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";
import { uploadService } from "@/modules/uploads/uploads.service.js";
import { notificationService } from "@/modules/notifications/notifications.service.js";
import type {
  AdminVerificationQueryInput,
  ReviewVerificationDocumentInput,
  UpdateProfileInput,
  VerificationDocumentUploadInput
} from "@/schemas/users.schema.js";

type PublicUser = Omit<User, "passwordHash" | "avatarPublicId">;
type PublicVerificationDocument = Omit<VerificationDocument, "publicId">;

function sanitizeUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, avatarPublicId: _avatarPublicId, ...safeUser } = user;
  return safeUser;
}

function sanitizeDocument(document: VerificationDocument): PublicVerificationDocument {
  const { publicId: _publicId, fileUrl: _fileUrl, ...safeDocument } = document;
  return { ...safeDocument, fileUrl: "" } as PublicVerificationDocument;
}

function verificationBody(status: VerificationStatus): string {
  if (status === VerificationStatus.VERIFIED) return "Your identity document has been approved.";
  if (status === VerificationStatus.REJECTED) return "Your identity document was rejected. Upload a new document for review.";
  if (status === VerificationStatus.RESUBMISSION_REQUESTED) return "Please upload a new identity document for review.";
  if (status === VerificationStatus.UNDER_REVIEW) return "Your identity document is under review.";
  return "Your identity document is waiting for review.";
}

export const userService = {
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const current = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { phoneNumber: true, phone: true, phoneVerified: true }
    });
    const nextPhone = input.phone?.replace(/[^\d+]/g, "");
    const samePhone = current.phoneNumber === nextPhone || current.phone === nextPhone;
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...input,
        ...(input.phone !== undefined
          ? {
              phone: nextPhone,
              phoneNumber: nextPhone || null,
              phoneVerified: samePhone && current.phoneVerified,
              phoneVerifiedAt: samePhone ? undefined : null
            }
          : {})
      },
    });
    return sanitizeUser(user);
  },

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const current = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const image = await uploadService.image(userId, file, "avatar");
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: image.url,
        avatarPublicId: image.publicId,
      },
    });
    if (current.avatarPublicId) {
      await uploadService.destroy(current.avatarPublicId).catch(() => undefined);
    }
    return sanitizeUser(user);
  },

  async listVerificationDocuments(userId: string) {
    const documents = await prisma.verificationDocument.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
    return documents.map(sanitizeDocument);
  },

  async uploadVerificationDocument(userId: string, input: VerificationDocumentUploadInput, file: Express.Multer.File) {
    const upload = await uploadService.verificationDocument(userId, file);
    const document = await prisma.verificationDocument.create({
      data: {
        userId,
        type: input.type,
        fileUrl: upload.url,
        publicId: upload.publicId,
        status: VerificationStatus.PENDING,
        rejectionReason: null
      }
    });

    await notificationService.create({
      userId,
      type: NotificationType.VERIFICATION,
      title: "Verification document submitted",
      body: "Your document has been uploaded and is waiting for review.",
      metadata: { documentId: document.id, status: document.status }
    });

    const admins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN, active: true },
      select: { id: true }
    });
    await Promise.all(
      admins.map((admin) =>
        notificationService.create({
          userId: admin.id,
          type: NotificationType.VERIFICATION,
          title: "Verification document ready for review",
          body: "A user uploaded a new identity document.",
          metadata: { documentId: document.id, userId }
        })
      )
    );

    return sanitizeDocument(document);
  },

  async listVerificationQueue(query: AdminVerificationQueryInput) {
    const documents = await prisma.verificationDocument.findMany({
      where: query.status ? { status: query.status } : undefined,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            verified: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    return documents.map((document) => {
      const { publicId: _publicId, ...safeDocument } = document;
      return safeDocument;
    });
  },

  async reviewVerificationDocument(documentId: string, input: ReviewVerificationDocumentInput) {
    const reviewedAt = input.status === VerificationStatus.PENDING ? null : new Date();
    const result = await prisma.$transaction(async (tx) => {
      const document = await tx.verificationDocument.update({
        where: { id: documentId },
        data: {
          status: input.status,
          rejectionReason: input.rejectionReason ?? null,
          reviewedAt
        }
      });
      const verifiedCount = await tx.verificationDocument.count({
        where: {
          userId: document.userId,
          status: VerificationStatus.VERIFIED
        }
      });
      await tx.user.update({
        where: { id: document.userId },
        data: { verified: verifiedCount > 0 }
      });
      return document;
    });

    await notificationService.create({
      userId: result.userId,
      type: NotificationType.VERIFICATION,
      title: "Verification status updated",
      body: verificationBody(result.status),
      metadata: { documentId: result.id, status: result.status }
    });

    return sanitizeDocument(result);
  },
};
