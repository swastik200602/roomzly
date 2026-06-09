import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowUpRight, DollarSign, Eye, Heart, MessageSquare } from "lucide-react";
import { analyticsApi } from "@/lib/api/analytics";
import { propertiesApi } from "@/lib/api/properties";
import { bookingsApi } from "@/lib/api/bookings";
import { messagesApi } from "@/lib/api/messages";
import { useAuth } from "@/stores/auth";
import { useWishlist } from "@/stores/wishlist";
import { formatCurrency } from "@/lib/currency";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Overview - Roomzly Dashboard" }] }),
  component: DashboardOverview,
});

function compact(value: number) {
  return Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function DashboardOverview() {
  const user = useAuth((state) => state.user);
  const wishlistCount = useWishlist((state) => state.ids.length);
  const canManageListings = user?.role === "OWNER" || user?.role === "ADMIN";
  const overviewQuery = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: analyticsApi.overview,
    enabled: canManageListings,
  });
  const revenueQuery = useQuery({
    queryKey: ["analytics", "revenue"],
    queryFn: analyticsApi.revenue,
    enabled: canManageListings,
  });
  const listingsQuery = useQuery({
    queryKey: ["owner-listings"],
    queryFn: propertiesApi.ownerListings,
    enabled: canManageListings,
  });
  const bookingsQuery = useQuery({
    queryKey: ["bookings", "dashboard"],
    queryFn: () => bookingsApi.list({ limit: 5 }),
    enabled: !canManageListings,
  });
  const threadsQuery = useQuery({
    queryKey: ["message-threads"],
    queryFn: messagesApi.threads,
    enabled: !canManageListings,
  });

  const overview = overviewQuery.data;
  const listings = listingsQuery.data ?? [];
  const bookings = bookingsQuery.data?.data ?? [];
  const threads = threadsQuery.data ?? [];
  const revenue = revenueQuery.data ?? [];
  const max = Math.max(1, ...revenue.map((point) => point.total));
  const points = revenue
    .map((point, index) => `${(index / Math.max(1, revenue.length - 1)) * 560},${160 - (point.total / max) * 140}`)
    .join(" ");

  const stats = canManageListings
    ? [
        { label: "Active listings", value: String(listings.length), icon: Eye },
        { label: "Total views", value: compact(overview?.totalViews ?? 0), icon: Eye },
        { label: "Saves", value: compact(overview?.totalSaves ?? 0), icon: Heart },
        { label: "Revenue", value: formatCurrency(overview?.totalRevenue ?? 0), icon: DollarSign },
      ]
    : [
        { label: "Bookings", value: String(bookingsQuery.data?.meta.total ?? bookings.length), icon: DollarSign },
        { label: "Saved homes", value: String(wishlistCount), icon: Heart },
        { label: "Conversations", value: String(threads.length), icon: MessageSquare },
        { label: "Pending stays", value: String(bookings.filter((booking) => booking.status === "PENDING").length), icon: Eye },
      ];

  return (
    <div className="p-4 sm:p-6 md:p-10 animate-fade-in">
      <div className="mb-8">
        <p className="text-mono-eyebrow mb-2">Welcome back</p>
        <h1 className="font-display text-3xl md:text-5xl tracking-tighter font-bold">Overview</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="bg-background p-4 sm:p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <stat.icon className="size-4 text-muted-foreground" />
              <span className="text-[10px] font-mono text-accent">Live</span>
            </div>
            <p className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-1">
              {(canManageListings ? overviewQuery.isLoading : bookingsQuery.isLoading) ? "..." : stat.value}
            </p>
            <p className="text-mono-eyebrow">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {canManageListings ? (
        <div className="lg:col-span-2 border border-border bg-surface p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <h2 className="font-display text-xl">Revenue over time</h2>
            <span className="text-mono-eyebrow">Last 12 months</span>
          </div>
          <svg viewBox="0 0 560 160" className="w-full h-44" preserveAspectRatio="none" aria-label="Revenue chart">
            {[0, 40, 80, 120, 160].map((y) => (
              <line key={y} x1="0" x2="560" y1={y} y2={y} stroke="hsl(var(--border))" strokeWidth="0.5" />
            ))}
            <polyline fill="none" stroke="hsl(var(--accent))" strokeWidth="2" points={points} />
            {revenue.map((point, index) => (
              <circle
                key={point.month}
                cx={(index / Math.max(1, revenue.length - 1)) * 560}
                cy={160 - (point.total / max) * 140}
                r="3"
                fill="hsl(var(--accent))"
              />
            ))}
          </svg>
          <div className="grid grid-cols-12 mt-2">
            {revenue.map((point) => (
              <span key={point.month} className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground text-center">
                {point.month.slice(5)}
              </span>
            ))}
          </div>
        </div>
        ) : (
        <div className="lg:col-span-2 border border-border bg-surface p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <h2 className="font-display text-xl">Recent bookings</h2>
            <Link to="/dashboard/bookings">
              <ArrowUpRight className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {bookings.map((booking) => (
              <li key={booking.id} className="py-3 flex items-center justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <p className="truncate">{booking.property.title}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {new Date(booking.checkIn).toLocaleDateString()} to {new Date(booking.checkOut).toLocaleDateString()}
                  </p>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">
                  {booking.status.toLowerCase()}
                </span>
              </li>
            ))}
            {!bookingsQuery.isLoading && bookings.length === 0 && (
              <li className="py-3 text-sm text-muted-foreground">No bookings yet.</li>
            )}
          </ul>
        </div>
        )}

        <div className="border border-border bg-surface p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl">{canManageListings ? "Top listings" : "Conversations"}</h2>
            <Link to={canManageListings ? "/dashboard/my-listings" : "/dashboard/messages"}>
              <ArrowUpRight className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
            </Link>
          </div>
          <ul className="space-y-4">
            {canManageListings ? listings.slice(0, 4).map((property) => (
              <li key={property.id} className="flex items-center gap-3">
                <img src={property.image} alt={property.title} className="size-11 object-cover border border-border shrink-0" />
                <div className="min-w-0 flex-1">
                  <Link to="/listing/$slug" params={{ slug: property.slug }}>
                    <p className="text-sm truncate hover:text-accent transition-colors">{property.title}</p>
                  </Link>
                  <p className="text-[10px] font-mono text-muted-foreground">{property.city}</p>
                </div>
                <span className="text-xs font-mono text-muted-foreground shrink-0">{property.reviews}r</span>
              </li>
            )) : threads.slice(0, 4).map((thread) => (
              <li key={thread.id} className="flex items-center gap-3">
                <div className="size-11 grid place-items-center bg-foreground text-background font-mono text-xs shrink-0">
                  {(thread.property?.title ?? "Chat").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <Link to="/dashboard/messages">
                    <p className="text-sm truncate hover:text-accent transition-colors">{thread.property?.title ?? "Conversation"}</p>
                  </Link>
                  <p className="text-[10px] font-mono text-muted-foreground truncate">{thread.messages[0]?.body ?? "No messages yet"}</p>
                </div>
                {(thread.unreadCount ?? 0) > 0 && (
                  <span className="text-xs font-mono text-accent shrink-0">{thread.unreadCount}</span>
                )}
              </li>
            ))}
            {canManageListings && !listingsQuery.isLoading && listings.length === 0 && (
              <li className="text-sm text-muted-foreground">No listings yet.</li>
            )}
            {!canManageListings && !threadsQuery.isLoading && threads.length === 0 && (
              <li className="text-sm text-muted-foreground">No conversations yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
