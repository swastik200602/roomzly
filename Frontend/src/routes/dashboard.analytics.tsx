import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, DollarSign, Eye, Heart, MessageSquare } from "lucide-react";
import { analyticsApi } from "@/lib/api/analytics";
import { useAuth } from "@/stores/auth";
import { formatCurrency } from "@/lib/currency";

export const Route = createFileRoute("/dashboard/analytics")({
  head: () => ({ meta: [{ title: "Analytics - Roomzly" }] }),
  component: AnalyticsPage,
});

function compact(value: number) {
  return Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function AnalyticsPage() {
  const user = useAuth((state) => state.user);
  const canManageListings = user?.role === "OWNER" || user?.role === "ADMIN";
  const overviewQuery = useQuery({ queryKey: ["analytics", "overview"], queryFn: analyticsApi.overview, enabled: canManageListings });
  const revenueQuery = useQuery({ queryKey: ["analytics", "revenue"], queryFn: analyticsApi.revenue, enabled: canManageListings });
  const topQuery = useQuery({ queryKey: ["analytics", "top-properties"], queryFn: analyticsApi.topProperties, enabled: canManageListings });
  const trafficQuery = useQuery({ queryKey: ["analytics", "traffic"], queryFn: analyticsApi.traffic, enabled: canManageListings });

  const overview = overviewQuery.data;
  const revenue = revenueQuery.data ?? [];
  const top = topQuery.data ?? [];
  const traffic = trafficQuery.data ?? [];
  const max = Math.max(1, ...revenue.map((point) => point.total));

  if (!canManageListings) {
    return (
      <div className="p-6 md:p-10 space-y-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">04 - Analytics</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tighter">Portfolio performance</h1>
        <p className="text-sm text-muted-foreground">Only owners and admins can view portfolio analytics.</p>
      </div>
    );
  }

  const kpis = [
    { label: "Revenue", value: formatCurrency(overview?.totalRevenue ?? 0), icon: DollarSign },
    { label: "Views", value: compact(overview?.totalViews ?? 0), icon: Eye },
    { label: "Saves", value: compact(overview?.totalSaves ?? 0), icon: Heart },
    { label: "Inquiries", value: compact(overview?.totalInquiries ?? 0), icon: MessageSquare },
  ];

  return (
    <div className="p-6 md:p-10 space-y-8">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          04 - Analytics
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tighter">
          Portfolio performance
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl">
          Database-backed performance across your active portfolio.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-background p-5">
            <div className="flex items-center justify-between mb-4">
              <kpi.icon className="size-4 text-muted-foreground" />
              <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-accent">
                <ArrowUpRight className="size-3" />
                Live
              </span>
            </div>
            <p className="font-display text-3xl font-bold tracking-tighter">{overviewQuery.isLoading ? "..." : kpi.value}</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
              {kpi.label}
            </p>
          </div>
        ))}
      </div>

      <div className="border border-border rounded-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight">Revenue trend</h2>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
              Last 12 months
            </p>
          </div>
          {revenueQuery.isError && (
            <button className="text-mono-eyebrow text-accent" onClick={() => revenueQuery.refetch()}>
              Retry
            </button>
          )}
        </div>

        <svg viewBox="0 0 600 200" className="w-full h-44 sm:h-56" preserveAspectRatio="none" role="img" aria-label="Revenue chart">
          {[0, 50, 100, 150, 200].map((y) => (
            <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="hsl(var(--border) / 0.6)" strokeWidth="0.5" />
          ))}
          <polyline
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="2"
            points={revenue.map((point, index) => `${(index / Math.max(1, revenue.length - 1)) * 600},${200 - (point.total / max) * 180}`).join(" ")}
          />
          {revenue.map((point, index) => (
            <circle
              key={point.month}
              cx={(index / Math.max(1, revenue.length - 1)) * 600}
              cy={200 - (point.total / max) * 180}
              r="2.5"
              fill="hsl(var(--accent))"
            />
          ))}
        </svg>

        <div className="grid grid-cols-12 gap-1 mt-3 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          {revenue.map((point) => (
            <span key={point.month} className="text-center">
              {point.month.slice(5)}
            </span>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border border-border rounded-sm p-6">
          <h3 className="font-display font-bold tracking-tight mb-4">Top performing</h3>
          <ul className="space-y-3">
            {top.map((property, index) => (
              <li key={property.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate">{property.title}</span>
                </span>
                <span className="font-mono text-xs">{property.viewCount}v</span>
              </li>
            ))}
            {!topQuery.isLoading && top.length === 0 && <li className="text-sm text-muted-foreground">No property analytics yet.</li>}
          </ul>
        </div>
        <div className="border border-border rounded-sm p-6">
          <h3 className="font-display font-bold tracking-tight mb-4">Traffic sources</h3>
          <ul className="space-y-3">
            {traffic.map((source) => (
              <li key={source.source}>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>{source.source}</span>
                  <span>{source.percentage}%</span>
                </div>
                <div className="h-1.5 bg-surface-hi">
                  <div className="h-full bg-accent" style={{ width: `${source.percentage}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
