import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type RoomzlyActionMarkProps = {
  className?: string;
};

export function RoomzlyActionMark({ className }: RoomzlyActionMarkProps) {
  return (
    <span className={cn("relative grid size-5 shrink-0 place-items-center", className)} aria-hidden="true">
      <motion.svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d="M4 12.2 12 5l8 7.2"
          initial={{ pathLength: 0, opacity: 0.35 }}
          animate={{ pathLength: [0, 1, 1], opacity: [0.35, 1, 0.75] }}
          transition={{ duration: 1.35, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.path
          d="M6.8 11.4V19h10.4v-7.6"
          initial={{ pathLength: 0, opacity: 0.2 }}
          animate={{ pathLength: [0, 0, 1], opacity: [0.2, 0.4, 1] }}
          transition={{ duration: 1.35, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.path
          d="M10 19v-4.5h4V19"
          initial={{ pathLength: 0, opacity: 0.15 }}
          animate={{ pathLength: [0, 0.35, 1], opacity: [0.15, 0.4, 1] }}
          transition={{ duration: 1.35, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
        />
      </motion.svg>
      <motion.span
        className="absolute inset-0 rounded-full border border-current/25"
        animate={{ scale: [0.85, 1.35], opacity: [0.45, 0] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
      />
    </span>
  );
}

type ActionButtonContentProps = {
  pending: boolean;
  idleLabel: string;
  pendingLabel: string;
  icon?: React.ReactNode;
};

export function ActionButtonContent({
  pending,
  idleLabel,
  pendingLabel,
  icon,
}: ActionButtonContentProps) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      {pending ? <RoomzlyActionMark /> : icon}
      <span>{pending ? pendingLabel : idleLabel}</span>
    </span>
  );
}
