import { create } from "zustand";

const MIN_VISIBLE_MS = 720;

interface LoadingState {
  visible: boolean;
  message: string;
  startedAt: number;
  show: (message: string) => void;
  hide: () => void;
  hideAfterMinimum: () => void;
}

let hideTimer: ReturnType<typeof setTimeout> | undefined;

export const usePremiumLoading = create<LoadingState>((set, get) => ({
  visible: false,
  message: "Opening Roomzly...",
  startedAt: 0,
  show: (message) => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ visible: true, message, startedAt: Date.now() });
  },
  hide: () => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ visible: false });
  },
  hideAfterMinimum: () => {
    if (hideTimer) clearTimeout(hideTimer);
    const elapsed = Date.now() - get().startedAt;
    const remaining = Math.max(MIN_VISIBLE_MS - elapsed, 0);
    hideTimer = setTimeout(() => set({ visible: false }), remaining);
  },
}));
