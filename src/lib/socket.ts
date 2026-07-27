"use client";

import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./auth-store";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

let socket: Socket | null = null;

/** Optional Socket.IO `/chat` client. Creates once per session. */
export function getChatSocket(): Socket | null {
  if (typeof window === "undefined") return null;

  const token = useAuthStore.getState().accessToken;
  if (!token) return null;

  if (socket?.connected) return socket;

  socket = io(`${SOCKET_URL}/chat`, {
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: true,
  });

  return socket;
}

export function disconnectChatSocket(): void {
  socket?.disconnect();
  socket = null;
}
