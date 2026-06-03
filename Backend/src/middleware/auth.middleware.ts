import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserRole, type UserRole as PrismaUserRole } from "@prisma/client";
import { env } from "@/config/env.js";
import { forbidden, unauthorized } from "@/lib/app-error.js";
import { prisma } from "@/lib/prisma.js";

function assertAccessPayload(value: unknown): asserts value is Express.AuthUser {
  if (
    typeof value !== "object" ||
    value === null ||
    typeof (value as { id?: unknown }).id !== "string" ||
    typeof (value as { email?: unknown }).email !== "string" ||
    typeof (value as { role?: unknown }).role !== "string"
  ) {
    throw unauthorized("Invalid token payload");
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) throw unauthorized();

  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
  assertAccessPayload(payload);
  req.user = {
    id: payload.id,
    email: payload.email,
    role: payload.role
  };
  next();
}

export function requireRole(...roles: PrismaUserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw unauthorized();
    if (!roles.includes(req.user.role)) throw forbidden();
    next();
  };
}

export async function requirePhoneVerified(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.user) throw unauthorized();
  if (req.user.role === UserRole.ADMIN) {
    next();
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { phoneVerified: true, active: true }
  });
  if (!user?.active) throw unauthorized("Account is disabled");
  if (!user.phoneVerified) {
    throw forbidden("Phone verification is required before using this feature");
  }
  next();
}
