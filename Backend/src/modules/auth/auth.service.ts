import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { CookieOptions, Response } from "express";
import { AuthProvider, UserRole, type User } from "@prisma/client";
import { env, isProduction } from "@/config/env.js";
import { AppError, conflict, unauthorized } from "@/lib/app-error.js";
import { sendPasswordResetEmail } from "@/lib/email.js";
import { prisma } from "@/lib/prisma.js";
import { safeCacheDelete, safeCacheGet, safeCacheSet } from "@/lib/redis.js";
import { adminAuditService, type AuditRequestContext } from "@/modules/admin/admin-audit.service.js";
import type { GoogleAuthInput, LoginInput, RegisterInput } from "@/schemas/auth.schema.js";
import { verifyGoogleCredential } from "@/modules/auth/google-oauth.js";

const accessTtl = "15m";
const refreshMs = 7 * 24 * 60 * 60 * 1000;
const refreshCookieName = "roomzly_refresh";
const refreshCookiePath = "/api/v1/auth";
const refreshCookieSameSite = env.COOKIE_SAME_SITE ?? (isProduction ? "none" : "lax");
const refreshCookieSecure = isProduction || refreshCookieSameSite === "none";

type PublicUser = Omit<User, "passwordHash" | "avatarPublicId">;

function sanitizeUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, avatarPublicId: _avatarPublicId, ...safeUser } = user;
  return safeUser;
}

function signAccessToken(user: Pick<User, "id" | "email" | "role">): string {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, env.JWT_ACCESS_SECRET, {
    expiresIn: accessTtl
  });
}

function signRefreshToken(user: Pick<User, "id" | "email" | "role">, tokenId: string): string {
  return jwt.sign({ id: user.id, email: user.email, role: user.role, tokenId }, env.JWT_REFRESH_SECRET, {
    expiresIn: "7d"
  });
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function setRefreshCookie(res: Response, token: string): void {
  const options: CookieOptions = {
    httpOnly: true,
    secure: refreshCookieSecure,
    sameSite: refreshCookieSameSite,
    domain: env.COOKIE_DOMAIN || undefined,
    maxAge: refreshMs,
    path: refreshCookiePath
  };
  res.cookie(refreshCookieName, token, options);
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(refreshCookieName, {
    httpOnly: true,
    secure: refreshCookieSecure,
    sameSite: refreshCookieSameSite,
    domain: env.COOKIE_DOMAIN || undefined,
    path: refreshCookiePath
  });
}

async function issueSession(user: User, res: Response) {
  const tokenRecord = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: "pending",
      expiresAt: new Date(Date.now() + refreshMs)
    }
  });
  const refreshToken = signRefreshToken(user, tokenRecord.id);
  await prisma.refreshToken.update({
    where: { id: tokenRecord.id },
    data: { tokenHash: hashToken(refreshToken) }
  });
  setRefreshCookie(res, refreshToken);

  return { user: sanitizeUser(user), accessToken: signAccessToken(user) };
}

function normalizeGoogleName(payload: Awaited<ReturnType<typeof verifyGoogleCredential>>) {
  const [fallbackFirst = "Google", ...fallbackLast] = (payload.name ?? "Google User").trim().split(/\s+/);
  return {
    firstName: payload.given_name?.trim() || fallbackFirst,
    lastName: payload.family_name?.trim() || fallbackLast.join(" ") || "User"
  };
}

function normalizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/[^\d+]/g, "");
}

export const authService = {
  async register(input: RegisterInput, res: Response) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw conflict("Email is already registered");
    const phoneNumber = input.phoneNumber ? normalizePhoneNumber(input.phoneNumber) : null;
    if (phoneNumber) {
      const existingPhone = await prisma.user.findFirst({
        where: { OR: [{ phoneNumber }, { phone: phoneNumber }] },
        select: { id: true }
      });
      if (existingPhone) throw conflict("Phone number is already registered");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        passwordHash,
        phone: phoneNumber,
        phoneNumber,
        phoneVerified: false,
        role: input.role === UserRole.ADMIN ? UserRole.RESIDENT : input.role
      }
    });

    return issueSession(user, res);
  },

  async login(input: LoginInput, res: Response, audit?: AuditRequestContext) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.active || !user.passwordHash) throw unauthorized("Invalid email or password");

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw unauthorized("Invalid email or password");

    const session = await issueSession(user, res);
    if (user.role === UserRole.ADMIN) {
      await adminAuditService.record({
        ...audit,
        adminId: user.id,
        action: "ADMIN_LOGIN",
        targetType: "ADMIN_SESSION",
        targetId: user.id,
        newState: { provider: "email" }
      });
    }
    return session;
  },

  async google(input: GoogleAuthInput, res: Response, audit?: AuditRequestContext) {
    const payload = await verifyGoogleCredential(input.credential);
    const email = payload.email.toLowerCase();
    const role = input.role === UserRole.ADMIN ? UserRole.RESIDENT : input.role;
    const names = normalizeGoogleName(payload);

    const user = await prisma.$transaction(async (tx) => {
      const account = await tx.authAccount.findUnique({
        where: {
          provider_providerAccountId: {
            provider: AuthProvider.GOOGLE,
            providerAccountId: payload.sub
          }
        },
        include: { user: true }
      });

      if (account) {
        if (!account.user.active) throw unauthorized("Account is disabled");
        return tx.user.update({
          where: { id: account.userId },
          data: {
            firstName: names.firstName,
            lastName: names.lastName,
            avatarUrl: payload.picture ?? account.user.avatarUrl
          }
        });
      }

      const existingUser = await tx.user.findUnique({ where: { email } });
      if (existingUser) {
        if (!existingUser.active) throw unauthorized("Account is disabled");
        await tx.authAccount.create({
          data: {
            userId: existingUser.id,
            provider: AuthProvider.GOOGLE,
            providerAccountId: payload.sub,
            email,
            profile: payload
          }
        });
        return tx.user.update({
          where: { id: existingUser.id },
          data: {
            avatarUrl: existingUser.avatarUrl ?? payload.picture
          }
        });
      }

      return tx.user.create({
        data: {
          firstName: names.firstName,
          lastName: names.lastName,
          email,
          passwordHash: null,
          role,
          avatarUrl: payload.picture,
          accounts: {
            create: {
              provider: AuthProvider.GOOGLE,
              providerAccountId: payload.sub,
              email,
              profile: payload
            }
          }
        }
      });
    });

    if (!user.active) throw unauthorized("Account is disabled");
    const session = await issueSession(user, res);
    if (user.role === UserRole.ADMIN) {
      await adminAuditService.record({
        ...audit,
        adminId: user.id,
        action: "ADMIN_LOGIN",
        targetType: "ADMIN_SESSION",
        targetId: user.id,
        newState: { provider: "google" }
      });
    }
    return session;
  },

  async refresh(refreshToken: string | undefined, res: Response) {
    if (!refreshToken) throw unauthorized("Refresh token missing");
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    if (typeof payload !== "object" || typeof payload.tokenId !== "string") {
      throw unauthorized("Invalid refresh token");
    }

    const tokenHash = hashToken(refreshToken);
    const record = await prisma.refreshToken.findUnique({
      where: { id: payload.tokenId },
      include: { user: true }
    });
    if (!record || record.tokenHash !== tokenHash || record.expiresAt < new Date()) {
      throw unauthorized("Invalid refresh token");
    }
    if (!record.user.active) throw unauthorized("Account is disabled");

    const result = await prisma.$transaction(async (tx) => {
      await tx.refreshToken.delete({ where: { id: record.id } });
      const nextRecord = await tx.refreshToken.create({
        data: {
          userId: record.userId,
          tokenHash: "pending",
          expiresAt: new Date(Date.now() + refreshMs)
        }
      });
      return { nextRecord, user: record.user };
    });

    const nextRefresh = signRefreshToken(result.user, result.nextRecord.id);
    await prisma.refreshToken.update({
      where: { id: result.nextRecord.id },
      data: { tokenHash: hashToken(nextRefresh) }
    });
    setRefreshCookie(res, nextRefresh);

    return { user: sanitizeUser(result.user), accessToken: signAccessToken(result.user) };
  },

  async logout(refreshToken: string | undefined, res: Response, audit?: AuditRequestContext) {
    let userId: string | undefined;
    if (refreshToken) {
      const payload = jwt.decode(refreshToken);
      if (typeof payload === "object" && payload && typeof payload.tokenId === "string") {
        const record = await prisma.refreshToken.findUnique({
          where: { id: payload.tokenId },
          include: { user: { select: { id: true, role: true } } }
        });
        if (record?.user.role === UserRole.ADMIN) userId = record.user.id;
        await prisma.refreshToken.deleteMany({ where: { id: payload.tokenId } });
      }
    }
    clearRefreshCookie(res);
    if (userId) {
      await adminAuditService.record({
        ...audit,
        adminId: userId,
        action: "ADMIN_LOGOUT",
        targetType: "ADMIN_SESSION",
        targetId: userId
      });
    }
    return { loggedOut: true };
  },

  async me(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return sanitizeUser(user);
  },

  async submitPhoneVerification(userId: string, inputPhoneNumber: string) {
    const phoneNumber = normalizePhoneNumber(inputPhoneNumber);
    const existing = await prisma.user.findFirst({
      where: {
        id: { not: userId },
        OR: [{ phoneNumber }, { phone: phoneNumber }]
      },
      select: { id: true }
    });
    if (existing) throw conflict("Phone number is already used on another account");

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        phone: phoneNumber,
        phoneNumber,
        phoneVerified: false,
        phoneVerifiedAt: null
      }
    });
    return sanitizeUser(user);
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { accepted: true };
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const resetKey = `reset:${tokenHash}`;
    await safeCacheSet(resetKey, user.id, 15 * 60);
    const storedUserId = await safeCacheGet(resetKey);
    if (storedUserId !== user.id) {
      throw new AppError(503, "RESET_STORAGE_UNAVAILABLE", "Password reset is temporarily unavailable");
    }
    const resetUrl = new URL("/auth/reset-password", env.FRONTEND_URL);
    resetUrl.searchParams.set("token", token);
    await sendPasswordResetEmail(user.email, resetUrl.toString());
    return { accepted: true };
  },

  async resetPassword(token: string, password: string) {
    const tokenHash = hashToken(token);
    const userId = await safeCacheGet(`reset:${tokenHash}`);
    if (!userId) throw unauthorized("Reset token expired");
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      prisma.refreshToken.deleteMany({ where: { userId } })
    ]);
    await safeCacheDelete(`reset:${tokenHash}`);
    return { reset: true };
  }
};
