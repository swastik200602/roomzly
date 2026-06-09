import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CompareState {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
}

const MAX = 4;

export const useCompare = create<CompareState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((s) => {
          if (s.ids.includes(id)) return { ids: s.ids.filter((x) => x !== id) };
          if (s.ids.length >= MAX) return s;
          return { ids: [...s.ids, id] };
        }),
      has: (id) => get().ids.includes(id),
      clear: () => set({ ids: [] }),
    }),
    { name: "roomzly.compare" },
  ),
);
