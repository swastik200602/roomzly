import { ReportTargetType } from "@prisma/client";
import { badRequest, notFound } from "@/lib/app-error.js";
import { prisma } from "@/lib/prisma.js";
import type { CreateReportInput } from "@/schemas/reports.schema.js";

export const reportsService = {
  async create(reporterId: string, input: CreateReportInput) {
    let propertyId: string | undefined;
    let reportedUserId: string | undefined;

    if (input.targetType === ReportTargetType.PROPERTY) {
      const property = await prisma.property.findUnique({
        where: { id: input.targetId },
        select: { id: true, ownerId: true }
      });
      if (!property) throw notFound("Property not found");
      propertyId = property.id;
      reportedUserId = property.ownerId;
    }

    if (input.targetType === ReportTargetType.USER) {
      const user = await prisma.user.findUnique({ where: { id: input.targetId }, select: { id: true } });
      if (!user) throw notFound("User not found");
      if (user.id === reporterId) throw badRequest("You cannot report yourself");
      reportedUserId = user.id;
    }

    if (input.targetType === ReportTargetType.MESSAGE_THREAD) {
      const thread = await prisma.messageThread.findFirst({
        where: { id: input.targetId, participants: { some: { userId: reporterId } } },
        include: { participants: { select: { userId: true } } }
      });
      if (!thread) throw notFound("Conversation not found");
      reportedUserId = thread.participants.find((participant) => participant.userId !== reporterId)?.userId;
    }

    return prisma.report.create({
      data: {
        reporterId,
        targetType: input.targetType,
        targetId: input.targetId,
        propertyId,
        reportedUserId,
        type: input.type,
        description: input.description
      }
    });
  }
};
