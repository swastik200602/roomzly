import { Link, Outlet, useNavigate, useRouterState, createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Home as HomeIcon,
  Plus,
  Calendar,
  BarChart3,
  MessageSquare,
  Settings,
  Shield,
  Bell,
  Search,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/stores/auth";
import { toast } from "sonner";
import { notificationsApi } from "@/lib/api/notifications";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Roomzly" }] }),
  component: DashboardLayout,
});

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/my-listings", label: "My Listings", icon: HomeIcon, ownerOnly: true },
  { to: "/dashboard/add-property", label: "Add Property", icon: Plus, ownerOnly: true },
  { to: "/dashboard/bookings", label: "Bookings", icon: Calendar },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3, ownerOnly: true },
  { to: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { to: "/dashboard/admin", label: "Admin", icon: Shield, adminOnly: true },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

const OWNER_PATHS = ["/dashboard/my-listings", "/dashboard/add-property", "/dashboard/analytics"];
const ADMIN_PATHS = ["/dashboard/admin"];

function DashboardLayout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setSidebarOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);
  const user = useAuth((s) => s.user);
  const bootstrapped = useAuth((s) => s.bootstrapped);
  const clearSession = useAuth((s) => s.clearSession);
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.list,
    enabled: Boolean(user),
  });
  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;
  const canManageListings = user?.role === "OWNER" || user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (bootstrapped && !user) {
      navigate({ to: "/auth/login" });
    }
  }, [bootstrapped, navigate, user]);

  useEffect(() => {
    if (!bootstrapped || !user || canManageListings) return;
    if (OWNER_PATHS.some((path) => pathname.startsWith(path))) {
      toast.error("Owner access is required for that page");
      navigate({ to: "/dashboard" });
    }
  }, [bootstrapped, canManageListings, navigate, pathname, user]);

  useEffect(() => {
    if (!bootstrapped || !user || isAdmin) return;
    if (ADMIN_PATHS.some((path) => pathname.startsWith(path))) {
      toast.error("Admin access is required for that page");
      navigate({ to: "/dashboard" });
    }
  }, [bootstrapped, isAdmin, navigate, pathname, user]);

  if (!bootstrapped) {
    return (
      <div className="min-h-dvh grid place-items-center bg-background">
        <p className="text-mono-eyebrow">Restoring session</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase() || "R";
  const logout = async () => {
    await authApi.logout().catch(() => undefined);
    clearSession();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  const SidebarContent = () => (
    <>
      <Link
        to="/"
        onClick={() => setSidebarOpen(false)}
        className="font-display text-lg font-bold tracking-tighter uppercase block mb-8 px-2 hover:text-accent transition-colors"
      >
        Roomzly
      </Link>
      <nav className="space-y-0.5 flex-1">
        {NAV.filter((item) => {
          if ("adminOnly" in item && item.adminOnly) return isAdmin;
          if ("ownerOnly" in item && item.ownerOnly) return canManageListings;
          return true;
        }).map((n) => {
          const exact = "exact" in n && n.exact;
          const active = exact ? pathname === n.to : pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="pt-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="size-8 rounded-full bg-foreground text-background grid place-items-center text-xs font-mono font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
            <p className="text-[10px] font-mono text-muted-foreground truncate">{user.role.toLowerCase()}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="mt-2 w-full text-left px-2 py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 rounded-sm"
        >
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-dvh flex flex-col md:grid md:grid-cols-[240px_1fr] bg-background">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex border-r border-border bg-sidebar p-4 sticky top-0 h-dvh flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 w-64 bg-sidebar p-4 flex flex-col h-full shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex flex-col min-w-0 flex-1">
        <header className="border-b border-border h-14 flex items-center justify-between px-4 sm:px-6 sticky top-0 bg-background z-30">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="md:hidden size-9 grid place-items-center hover:bg-surface-hi rounded-sm shrink-0"
            >
              <Menu className="size-4" />
            </button>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  navigate({ to: "/explore", search: { q: searchQuery.trim() } });
                }
              }}
              className="flex items-center gap-2 flex-1 max-w-md"
            >
              <Search className="size-4 text-muted-foreground shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rentals near colleges…"
                className="bg-transparent text-sm w-full focus:outline-none placeholder:text-muted-foreground/60"
              />
            </form>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <button
              aria-label="Notifications"
              type="button"
              onClick={() => setNotificationsOpen((value) => !value)}
              className="size-9 grid place-items-center hover:bg-surface-hi rounded-sm relative"
            >
              <Bell className="size-4" />
              {unreadCount > 0 && <span className="absolute top-2 right-2 size-1.5 rounded-full bg-accent" />}
            </button>
            {notificationsOpen && (
              <div className="absolute right-4 top-14 w-[min(360px,calc(100vw-2rem))] border border-border bg-background shadow-2xl z-40">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <p className="text-mono-eyebrow">Notifications</p>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={async () => {
                        await notificationsApi.markAllRead();
                        queryClient.invalidateQueries({ queryKey: ["notifications"] });
                      }}
                      className="text-[10px] font-mono uppercase tracking-widest text-accent"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notificationsQuery.isLoading && <p className="p-4 text-sm text-muted-foreground">Loading notifications</p>}
                  {!notificationsQuery.isLoading && notifications.length === 0 && (
                    <p className="p-4 text-sm text-muted-foreground">No notifications yet.</p>
                  )}
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={async () => {
                        if (!notification.readAt) {
                          await notificationsApi.markRead(notification.id);
                          queryClient.invalidateQueries({ queryKey: ["notifications"] });
                        }
                      }}
                      className="w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-surface-hi"
                    >
                      <div className="flex items-start gap-2">
                        {!notification.readAt && <span className="mt-1.5 size-1.5 rounded-full bg-accent shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.body}</p>
                          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70 mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {canManageListings && (
              <Link
                to="/dashboard/add-property"
                className="hidden sm:inline-flex bg-accent text-accent-foreground px-3 py-2 text-xs font-bold uppercase tracking-widest rounded-sm gap-2 items-center"
              >
                <Plus className="size-3.5" /> Add listing
              </Link>
            )}
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
