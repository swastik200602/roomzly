import { create } from "zustand";
import { persist } from "zustand/middleware";
import { wishlistApi } from "@/lib/api/wishlist";

interface WishlistState {
  ids: string[];
  toggle: (id: string) => Promise<void>;
  has: (id: string) => boolean;
  setIds: (ids: string[]) => void;
  clear: () => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: async (id) => {
        const wasSaved = get().ids.includes(id);
        set((s) => ({
          ids: wasSaved ? s.ids.filter((x) => x !== id) : [...s.ids, id],
        }));
        try {
          if (wasSaved) await wishlistApi.remove(id);
          else await wishlistApi.add(id);
        } catch {
          set((s) => ({
            ids: wasSaved ? [...new Set([...s.ids, id])] : s.ids.filter((x) => x !== id),
          }));
        }
      },
      has: (id) => get().ids.includes(id),
      setIds: (ids) => set({ ids }),
      clear: () => set({ ids: [] }),
    }),
    { name: "roomzly.wishlist" },
  ),
);
