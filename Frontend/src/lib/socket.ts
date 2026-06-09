import { io, type Socket } from "socket.io-client";

function resolveApiBase() {
  const configured = import.meta.env.VITE_API_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (import.meta.env.PROD) {
    throw new Error("Missing VITE_API_URL. Set it to the production backend API URL before building.");
  }
  return "http://localhost:4000/api/v1";
}

const API_BASE = resolveApiBase();
const SOCKET_BASE = API_BASE.replace(/\/api\/v\d+\/?$/, "");

let socket: Socket | null = null;
let socketToken: string | null = null;

export function getSocket(accessToken: string) {
  if (socket && socketToken === accessToken) return socket;
  if (socket) socket.disconnect();
  socketToken = accessToken;
  socket = io(SOCKET_BASE, {
    auth: { token: accessToken },
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 750,
    reconnectionDelayMax: 5000,
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  socketToken = null;
}
