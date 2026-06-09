import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Check, Clock, Download, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ApiError } from "@/lib/api/client";
import { bookingsApi, type Booking } from "@/lib/api/bookings";
import { useAuth } from "@/stores/auth";
import { formatCurrency } from "@/lib/currency";

export const Route = createFileRoute("/dashboard/bookings")({
  head: () => ({ meta: [{ title: "Bookings - Roomzly" }] }),
  component: BookingsPage,
});

const statusStyles: Record<Booking["status"], string> = {
  CONFIRMED: "bg-accent/15 text-accent border-accent/30",
  PENDING: "bg-foreground/10 text-foreground border-border",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/30",
  COMPLETED: "bg-accent/10 text-accent border-accent/30",
};

const statusIcon: Record<Booking["status"], typeof Check> = {
  CONFIRMED: Check,
  PENDING: Clock,
  CANCELLED: X,
  COMPLETED: Check,
};

function downloadBlob(blob: Blob, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

function BookingsPage() {
  const queryClient = useQueryClient();
  const user = useAuth((state) => state.user);
  const bookingsQuery = useQuery({
    queryKey: ["bookings"],
    queryFn: () => bookingsApi.list({ limit: 50 }),
  });
  const exportMutation = useMutation({
    mutationFn: bookingsApi.exportCsv,
    onSuccess: (blob) => downloadBlob(blob, "roomzly-bookings.csv"),
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not export bookings");
    },
  });
  const confirmMutation = useMutation({
    mutationFn: bookingsApi.confirm,
    onSuccess: () => {
      toast.success("Booking confirmed");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not confirm booking");
    },
  });
  const cancelMutation = useMutation({
    mutationFn: bookingsApi.cancel,
    onSuccess: () => {
      toast.success("Booking cancelled");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not cancel booking");
    },
  });
  const bookings = bookingsQuery.data?.data ?? [];
  const canConfirm = user?.role === "OWNER" || user?.role === "ADMIN";
  const pending = bookings.filter((booking) => booking.status === "PENDING").length;
  const upcoming = bookings.filter((booking) => ["PENDING", "CONFIRMED"].includes(booking.status)).length;
  const revenue = bookings
    .filter((booking) => booking.status === "CONFIRMED" || booking.status === "COMPLETED")
    .reduce((sum, booking) => sum + Number(booking.total), 0);

  return (
    <div className="p-6 md:p-10 space-y-8">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            03 - Bookings
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tighter">
            Reservation pipeline
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            All requests, holds, and confirmed stays across your portfolio.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-sm hover:bg-surface-hi transition-colors font-mono text-[10px] uppercase tracking-widest disabled:opacity-50"
          onClick={() => exportMutation.mutate()}
          disabled={bookings.length === 0 || exportMutation.isPending}
        >
          <Download className="size-3.5" />
          {exportMutation.isPending ? "Exporting" : "Export CSV"}
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border">
        {[
          { label: "Upcoming", value: String(upcoming) },
          { label: "Pending", value: String(pending) },
          { label: "Revenue", value: formatCurrency(revenue) },
          { label: "Total", value: String(bookingsQuery.data?.meta.total ?? bookings.length) },
        ].map((stat) => (
          <div key={stat.label} className="bg-background p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {stat.label}
            </p>
            <p className="font-display text-2xl font-bold tracking-tighter mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="border border-border rounded-sm overflow-x-auto">
        <div className="min-w-[880px]">
          <div className="grid grid-cols-[1fr_1.4fr_1.2fr_0.6fr_0.8fr_0.8fr_1fr] gap-4 px-5 py-3 bg-surface-hi border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <div>Guest</div>
            <div>Property</div>
            <div>Dates</div>
            <div>Nights</div>
            <div>Total</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          <div className="divide-y divide-border">
            {bookingsQuery.isLoading && <p className="p-5 text-sm text-muted-foreground">Loading bookings</p>}
            {bookingsQuery.isError && (
              <button className="m-5 text-mono-eyebrow text-accent" onClick={() => bookingsQuery.refetch()}>
                Retry bookings
              </button>
            )}
            {!bookingsQuery.isLoading && bookings.length === 0 && (
              <p className="p-5 text-sm text-muted-foreground">No bookings yet.</p>
            )}
            {bookings.map((booking) => {
              const Icon = statusIcon[booking.status];
              const initials = `${booking.guest.firstName[0] ?? ""}${booking.guest.lastName[0] ?? ""}`.toUpperCase();
              return (
                <div
                  key={booking.id}
                  className="grid grid-cols-[1fr_1.4fr_1.2fr_0.6fr_0.8fr_0.8fr_1fr] gap-4 px-5 py-4 items-center text-sm hover:bg-surface-hi/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-9 shrink-0">
                      <AvatarFallback className="bg-foreground text-background text-[11px] font-mono font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{booking.guest.firstName} {booking.guest.lastName}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{booking.id}</p>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate">{booking.property.title}</p>
                    <p className="font-mono text-[10px] text-muted-foreground truncate">{booking.property.city}</p>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <span className="font-mono text-[11px]">
                      {new Date(booking.checkIn).toLocaleDateString()} to {new Date(booking.checkOut).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="font-mono text-xs">{booking.nights}</div>
                  <div className="font-mono font-bold">{formatCurrency(booking.total)}</div>
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 border rounded-sm text-[10px] font-mono uppercase tracking-widest ${statusStyles[booking.status]}`}>
                      <Icon className="size-3" />
                      {booking.status.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {booking.status === "PENDING" && canConfirm && (
                      <button
                        type="button"
                        onClick={() => confirmMutation.mutate(booking.id)}
                        disabled={confirmMutation.isPending}
                        className="px-2 py-1 border border-accent/30 text-accent rounded-sm font-mono text-[10px] uppercase tracking-widest hover:bg-accent/10 disabled:opacity-50"
                      >
                        Confirm
                      </button>
                    )}
                    {["PENDING", "CONFIRMED"].includes(booking.status) && (
                      <button
                        type="button"
                        onClick={() => cancelMutation.mutate(booking.id)}
                        disabled={cancelMutation.isPending}
                        className="px-2 py-1 border border-destructive/30 text-destructive rounded-sm font-mono text-[10px] uppercase tracking-widest hover:bg-destructive/10 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
