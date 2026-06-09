import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PropertyCard } from "@/components/property/PropertyCard";
import { wishlistApi } from "@/lib/api/wishlist";
import { useAuth } from "@/stores/auth";
import { useWishlist } from "@/stores/wishlist";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist - Roomzly" },
      { name: "description", content: "Properties you've saved on Roomzly." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const user = useAuth((state) => state.user);
  const setIds = useWishlist((state) => state.setIds);
  const queryClient = useQueryClient();
  const wishlistQuery = useQuery({
    queryKey: ["wishlist"],
    queryFn: wishlistApi.list,
    enabled: Boolean(user),
  });
  const items = wishlistQuery.data ?? [];
  const saved = items.map((item) => item.property);

  const clearMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(items.map((item) => wishlistApi.remove(item.propertyId)));
    },
    onSuccess: () => {
      setIds([]);
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Wishlist cleared");
    },
    onError: () => {
      toast.error("Could not clear wishlist");
    },
  });

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-16 animate-fade-in">
        <div className="border border-border p-16 text-center bg-surface">
          <Heart className="size-8 mx-auto text-muted-foreground mb-4" />
          <p className="text-mono-eyebrow mb-3">Saved properties</p>
          <h1 className="font-display text-3xl mb-3">Sign in to view your wishlist.</h1>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
            Saved properties are stored in your Roomzly account.
          </p>
          <Link
            to="/auth/login"
            className="bg-foreground text-background px-5 py-2.5 text-sm font-semibold rounded-sm inline-block hover:opacity-80 transition-opacity"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 animate-fade-in">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="text-mono-eyebrow mb-3">Saved properties</p>
          <h1 className="font-display text-4xl md:text-5xl tracking-tighter font-bold">
            Wishlist
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {wishlistQuery.isLoading ? "Loading" : `${saved.length} ${saved.length === 1 ? "property" : "properties"} saved`}
          </p>
        </div>
        {saved.length > 0 && (
          <button
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase border border-border px-4 py-2.5 rounded-sm hover:bg-surface-hi transition-colors disabled:opacity-50"
          >
            <Trash2 className="size-3.5" /> Clear all
          </button>
        )}
      </div>

      {wishlistQuery.isLoading ? (
        <div className="border border-border p-16 text-center bg-surface">
          <p className="text-mono-eyebrow">Loading saved properties</p>
        </div>
      ) : wishlistQuery.isError ? (
        <div className="border border-border p-16 text-center bg-surface">
          <p className="text-mono-eyebrow mb-3">Could not load wishlist</p>
          <button
            onClick={() => wishlistQuery.refetch()}
            className="bg-foreground text-background px-5 py-2.5 text-sm font-semibold rounded-sm inline-block hover:opacity-80 transition-opacity"
          >
            Retry
          </button>
        </div>
      ) : saved.length === 0 ? (
        <div className="border border-border p-16 text-center bg-surface">
          <Heart className="size-8 mx-auto text-muted-foreground mb-4" />
          <p className="text-mono-eyebrow mb-3">Nothing saved yet</p>
          <h2 className="font-display text-2xl mb-3">
            Start collecting places worth keeping.
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
            Tap the heart on any property to save it here for later.
          </p>
          <Link
            to="/explore"
            className="bg-foreground text-background px-5 py-2.5 text-sm font-semibold rounded-sm inline-block hover:opacity-80 transition-opacity"
          >
            Explore properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-12">
          {saved.map((p, i) => (
            <PropertyCard key={p.id} property={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
