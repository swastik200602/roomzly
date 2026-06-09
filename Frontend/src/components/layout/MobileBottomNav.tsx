import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, Home, MessageCircle, Search, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/stores/auth";

const ITEMS = [
  { to: "/", activePath: "/", icon: Home, label: "Home" },
  { to: "/explore", activePath: "/explore", icon: Search, label: "Explore" },
  { to: "/wishlist", activePath: "/wishlist", icon: Heart, label: "Saved" },
] as const;

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const user = useAuth((state) => state.user);
  const [visible, setVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    setVisible(true);
    lastScrollYRef.current = window.scrollY;
  }, [pathname]);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const currentY = Math.max(window.scrollY, 0);
        const delta = currentY - lastScrollYRef.current;

        if (currentY < 24 || delta < -8) {
          setVisible(true);
        } else if (currentY > 96 && delta > 8) {
          setVisible(false);
        }

        lastScrollYRef.current = currentY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/listing")
  ) return null;

  const items = [
    ...ITEMS,
    {
      to: user ? "/dashboard/messages" : "/auth/login",
      activePath: "/dashboard/messages",
      icon: MessageCircle,
      label: "Chat",
    } as const,
    {
      to: user ? "/dashboard" : "/auth/login",
      activePath: "/dashboard",
      icon: User,
      label: user ? "Profile" : "Sign in",
    } as const,
  ];

  return (
    <div
      className={cn(
        "fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 md:hidden transition-all duration-300 ease-out",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-24 opacity-0",
      )}
    >
      <div className="mx-auto flex h-[64px] max-w-md items-center gap-1 rounded-full border border-border bg-background/95 px-2 text-foreground shadow-[0_18px_48px_rgba(0,0,0,0.18)] backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {items.map((it) => {
          const active =
            it.activePath === "/" ? pathname === "/" : pathname.startsWith(it.activePath);
          return (
            <Link
              key={it.activePath}
              to={it.to}
              preload={false}
              aria-label={it.label}
              className={cn(
                "flex h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-medium transition-colors",
                active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-surface-hi hover:text-foreground",
              )}
            >
              <it.icon className="size-4 shrink-0" />
              <span className="w-full truncate px-1 text-center leading-none">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
