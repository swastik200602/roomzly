import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, GitCompare, User, Search, Menu, X, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useWishlist } from "@/stores/wishlist";
import { useCompare } from "@/stores/compare";
import { useAuth } from "@/stores/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/explore", label: "Explore" },
  { to: "/search-map", label: "Map Search", icon: MapPin },
  { to: "/pg-hostels", label: "Student PGs" },
  { to: "/verified-owners", label: "Verified Owners" },
  { to: "/journal", label: "Journal" },
] as const;

export function Navbar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const wishCount = useWishlist((s) => s.ids.length);
  const compCount = useCompare((s) => s.ids.length);
  const user = useAuth((s) => s.user);
  const canManageListings = user?.role === "OWNER" || user?.role === "ADMIN";
  const [open, setOpen] = useState(false);

  const isCurrent = (to: string) => {
    if (to === "/") return pathname === "/";
    return pathname === to || pathname.startsWith(`${to}/`);
  };

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (pathname.startsWith("/dashboard")) return null;

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 font-display text-xl tracking-tighter font-bold uppercase hover:text-accent transition-colors shrink-0"
          >
            <img
              src="/favicon-512.png"
              alt=""
              className="size-8 rounded-md object-contain"
              width={32}
              height={32}
              loading="eager"
            />
            <span>Roomzly</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-5 lg:gap-7 text-sm font-medium">
            {NAV.map((n) => {
              const active = isCurrent(n.to);
              const Icon = "icon" in n ? n.icon : null;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  preload={false}
                  className={cn(
                    "relative py-1 transition-colors flex items-center gap-1.5",
                    active
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {Icon && <Icon className={cn("size-3.5", active ? "text-accent" : "text-muted-foreground")} />}
                  <span>{n.label}</span>
                  {active && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Search — always visible */}
            <Link
              to="/explore"
              preload={false}
              aria-label="Search"
              className="size-9 grid place-items-center hover:bg-surface-hi rounded-sm transition-colors"
            >
              <Search className="size-4" />
            </Link>

            <ThemeToggle />

            {/* Compare — hidden on small mobile */}
            <Link
              to="/compare"
              preload={false}
              aria-label="Compare"
              className="relative size-9 grid place-items-center hover:bg-surface-hi rounded-sm transition-colors hidden sm:grid"
            >
              <GitCompare className="size-4" />
              {compCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 size-4 text-[9px] font-mono font-bold rounded-full bg-accent text-accent-foreground grid place-items-center">
                  {compCount}
                </span>
              )}
            </Link>

            {/* Wishlist — hidden on small mobile */}
            <Link
              to="/wishlist"
              preload={false}
              aria-label="Wishlist"
              className="relative size-9 grid place-items-center hover:bg-surface-hi rounded-sm transition-colors hidden sm:grid"
            >
              <Heart className="size-4" />
              {wishCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 size-4 text-[9px] font-mono font-bold rounded-full bg-accent text-accent-foreground grid place-items-center">
                  {wishCount}
                </span>
              )}
            </Link>

            {/* Sign in — desktop */}
            <Link
              to={user ? "/dashboard" : "/auth/login"}
              preload={false}
              className="hidden md:inline-flex text-sm font-semibold bg-foreground text-background px-4 py-2 rounded-sm hover:opacity-80 transition-opacity items-center gap-2 ml-1"
            >
              <User className="size-3.5" />
              {user ? "Dashboard" : "Sign In"}
            </Link>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
              className="md:hidden size-9 grid place-items-center hover:bg-surface-hi rounded-sm transition-colors ml-1"
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col" onClick={() => setOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Panel */}
          <div
            className="absolute top-16 left-0 right-0 bg-background border-b border-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nav links */}
            <div className="px-4 py-2 border-b border-border">
              {NAV.map((n) => {
                const active = isCurrent(n.to);
                const Icon = "icon" in n ? n.icon : null;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    preload={false}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center justify-between h-12 text-sm font-medium transition-colors border-b border-border last:border-0",
                      active ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      {Icon && <Icon className={cn("size-4", active ? "text-accent" : "text-muted-foreground")} />}
                      {n.label}
                    </span>
                    {n.to === "/search-map" && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-accent/15 text-accent">
                        Live Map
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Actions */}
            <div className="px-4 py-4 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/wishlist"
                  preload={false}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 h-11 border border-border rounded-sm text-sm font-medium hover:bg-surface-hi transition-colors"
                >
                  <Heart className="size-4" />
                  Saved
                  {wishCount > 0 && (
                    <span className="size-4 text-[9px] font-mono font-bold rounded-full bg-accent text-accent-foreground grid place-items-center">
                      {wishCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/compare"
                  preload={false}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 h-11 border border-border rounded-sm text-sm font-medium hover:bg-surface-hi transition-colors"
                >
                  <GitCompare className="size-4" />
                  Compare
                  {compCount > 0 && (
                    <span className="size-4 text-[9px] font-mono font-bold rounded-full bg-accent text-accent-foreground grid place-items-center">
                      {compCount}
                    </span>
                  )}
                </Link>
              </div>
              {canManageListings && (
                <Link
                  to="/dashboard/add-property"
                  preload={false}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center h-11 border border-border rounded-sm text-sm font-medium hover:bg-surface-hi transition-colors"
                >
                  List Property
                </Link>
              )}
              <Link
                to={user ? "/dashboard" : "/auth/login"}
                preload={false}
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 h-11 bg-foreground text-background rounded-sm text-sm font-semibold hover:opacity-80 transition-opacity"
              >
                <User className="size-4" />
                {user ? "Dashboard" : "Sign In"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}