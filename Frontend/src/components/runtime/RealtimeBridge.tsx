import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authApi, type AuthUser } from "@/lib/api/auth";
import type { Booking } from "@/lib/api/bookings";
import type { Message } from "@/lib/api/messages";
import type { Notification } from "@/lib/api/notifications";
import { disconnectSocket, getSocket } from "@/lib/socket";
import { useAuth } from "@/stores/auth";

type VerificationStatusPayload = Partial<Pick<AuthUser, "verified" | "phoneVerified" | "phoneVerifiedAt">> & {
  status?: string;
};

export function RealtimeBridge() {
  const queryClient = useQueryClient();
  const user = useAuth((state) => state.user);
  const accessToken = useAuth((state) => state.accessToken);
  const setSession = useAuth((state) => state.setSession);

  useEffect(() => {
    if (!user || !accessToken) {
      disconnectSocket();
      return;
    }

    const socket = getSocket(accessToken);

    const refetchRealtimeData = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["message-threads"] });
    };

    const onNotification = (notification: Notification) => {
      queryClient.setQueryData<Notification[]>(["notifications"], (previous) => {
        if (!previous) return [notification];
        if (previous.some((item) => item.id === notification.id)) return previous;
        return [notification, ...previous].slice(0, 50);
      });
      toast(notification.title, { description: notification.body });
    };

    const onBooking = (booking: Booking) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.setQueryData(["booking", booking.id], booking);
    };

    const onMessage = (message: Message) => {
      queryClient.setQueryData(["message-thread", message.threadId], (previous: any) => {
        if (!previous || previous.messages?.some((item: Message) => item.id === message.id)) return previous;
        return { ...previous, messages: [...previous.messages, message], updatedAt: message.createdAt };
      });
      queryClient.invalidateQueries({ queryKey: ["message-threads"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };

    const onThreadChanged = () => {
      queryClient.invalidateQueries({ queryKey: ["message-threads"] });
    };

    const onVerification = async (payload: VerificationStatusPayload) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      try {
        const freshUser = await authApi.me();
        setSession({ user: freshUser, accessToken });
      } catch {
        setSession({
          user: {
            ...user,
            ...(payload.verified !== undefined ? { verified: payload.verified } : {}),
            ...(payload.phoneVerified !== undefined ? { phoneVerified: payload.phoneVerified } : {}),
            ...(payload.phoneVerifiedAt !== undefined ? { phoneVerifiedAt: payload.phoneVerifiedAt } : {}),
          },
          accessToken,
        });
      }
    };

    const onOffline = () => toast("Connection paused", { description: "Realtime updates will resume when you are online." });

    socket.on("connect", refetchRealtimeData);
    socket.io.on("reconnect", refetchRealtimeData);
    socket.on("new_notification", onNotification);
    socket.on("new_booking", onBooking);
    socket.on("booking_confirmed", onBooking);
    socket.on("booking_cancelled", onBooking);
    socket.on("new_message", onMessage);
    socket.on("unread_count_changed", onThreadChanged);
    socket.on("thread_deleted", onThreadChanged);
    socket.on("verification_status_changed", onVerification);
    socket.on("property_verification_status_changed", onVerification);
    window.addEventListener("online", refetchRealtimeData);
    window.addEventListener("offline", onOffline);

    return () => {
      socket.off("connect", refetchRealtimeData);
      socket.io.off("reconnect", refetchRealtimeData);
      socket.off("new_notification", onNotification);
      socket.off("new_booking", onBooking);
      socket.off("booking_confirmed", onBooking);
      socket.off("booking_cancelled", onBooking);
      socket.off("new_message", onMessage);
      socket.off("unread_count_changed", onThreadChanged);
      socket.off("thread_deleted", onThreadChanged);
      socket.off("verification_status_changed", onVerification);
      socket.off("property_verification_status_changed", onVerification);
      window.removeEventListener("online", refetchRealtimeData);
      window.removeEventListener("offline", onOffline);
    };
  }, [accessToken, queryClient, setSession, user]);

  return null;
}
