import { useEffect, type ReactNode } from "react";
import { authApi } from "@/lib/api/auth";
import { wishlistApi } from "@/lib/api/wishlist";
import { registerSessionRefresher } from "@/lib/api/client";
import { useAuth } from "@/stores/auth";
import { useWishlist } from "@/stores/wishlist";

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const setSession = useAuth((s) => s.setSession);
  const clearSession = useAuth((s) => s.clearSession);
  const setBootstrapped = useAuth((s) => s.setBootstrapped);
  const bootstrapped = useAuth((s) => s.bootstrapped);
  const user = useAuth((s) => s.user);
  const setWishlistIds = useWishlist((s) => s.setIds);

  useEffect(() => {
    registerSessionRefresher(async () => {
      try {
        const session = await authApi.refresh();
        setSession(session);
        return session.accessToken;
      } catch {
        clearSession();
        return null;
      }
    });

    let cancelled = false;
    authApi
      .refresh()
      .then((session) => {
        if (!cancelled) setSession(session);
      })
      .catch(() => {
        if (!cancelled) setBootstrapped(true);
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession, setBootstrapped, setSession]);

  useEffect(() => {
    if (!bootstrapped) return;
    if (!user) {
      setWishlistIds([]);
      return;
    }

    let cancelled = false;
    async function hydrateWishlist() {
      const localIds = useWishlist.getState().ids;
      const items = await wishlistApi.list();
      const serverIds = items.map((item) => item.propertyId);
      const merged = [...new Set([...serverIds, ...localIds])];
      if (merged.length !== serverIds.length) {
        await wishlistApi.sync(merged);
      }
      if (!cancelled) setWishlistIds(merged);
    }

    hydrateWishlist().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [bootstrapped, setWishlistIds, user]);

  return <>{children}</>;
}
