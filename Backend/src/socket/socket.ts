import type { Server as HttpServer } from "node:http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { allowedOrigins } from "@/config/cors.js";
import { env } from "@/config/env.js";
import { logger } from "@/lib/logger.js";
import { prisma } from "@/lib/prisma.js";

let io: Server | undefined;

export function createSocketServer(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (typeof token !== "string") return next(new Error("Authentication required"));
    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
      if (typeof payload !== "object" || typeof payload.id !== "string") {
        return next(new Error("Invalid token"));
      }
      socket.data.userId = payload.id;
      return next();
    } catch (error) {
      return next(error instanceof Error ? error : new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);

    socket.on("join_thread", async (threadId: string) => {
      if (typeof threadId !== "string" || !threadId) return;
      const participant = await prisma.threadParticipant.findUnique({
        where: { threadId_userId: { threadId, userId } },
        select: { id: true }
      });
      if (participant) socket.join(`thread:${threadId}`);
    });

    socket.on("leave_thread", (threadId: string) => {
      socket.leave(`thread:${threadId}`);
    });

    socket.on("typing", async (payload: { threadId?: string }) => {
      if (!payload.threadId) return;
      const participant = await prisma.threadParticipant.findUnique({
        where: { threadId_userId: { threadId: payload.threadId, userId } },
        select: { id: true }
      });
      if (!participant) return;
      socket.to(`thread:${payload.threadId}`).emit("typing", { userId, threadId: payload.threadId });
    });

    socket.on("disconnect", () => {
      logger.debug({ userId }, "Socket disconnected");
    });
  });

  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function emitToThread(threadId: string, event: string, payload: unknown): void {
  io?.to(`thread:${threadId}`).emit(event, payload);
}
