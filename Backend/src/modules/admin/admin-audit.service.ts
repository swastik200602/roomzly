import type { AdminAuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";

export type AuditRequestContext = {
  adminId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

type AuditInput = AuditRequestContext & {
  action: AdminAuditAction;
  targetType: string;
  targetId?: string | null;
  previousState?: Prisma.InputJsonValue | null;
  newState?: Prisma.InputJsonValue | null;
};

export const adminAuditService = {
  async record(input: AuditInput) {
    return prisma.adminAuditLog.create({
      data: {
        adminId: input.adminId ?? null,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        previousState: input.previousState ?? undefined,
        newState: input.newState ?? undefined,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null
      }
    });
  }
};

export function auditContextFromRequest(req: {
  user?: { id: string };
  ip?: string;
  headers: { "user-agent"?: string | string[] };
}): AuditRequestContext {
  const userAgent = req.headers["user-agent"];
  return {
    adminId: req.user?.id ?? null,
    ipAddress: req.ip ?? null,
    userAgent: Array.isArray(userAgent) ? userAgent.join(" ") : userAgent ?? null
  };
}
