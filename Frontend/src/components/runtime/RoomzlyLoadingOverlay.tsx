import { AnimatePresence, motion } from "framer-motion";

import { usePremiumLoading } from "@/stores/loading";

const lineEase = [0.16, 1, 0.3, 1] as const;

export function RoomzlyLoadingOverlay() {
  const visible = usePremiumLoading((state) => state.visible);
  const message = usePremiumLoading((state) => state.message);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] overflow-hidden bg-[#050608] text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: lineEase }}
          role="status"
          aria-live="polite"
        >
          <ArchitecturalField />

          <div className="relative z-10 grid min-h-dvh place-items-center px-6">
            <motion.div
              className="w-full max-w-md text-center"
              initial={{ opacity: 0, y: 14, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{ duration: 0.42, ease: lineEase }}
            >
              <div className="mx-auto mb-8 flex items-center justify-center gap-3">
                <motion.span
                  className="h-px w-12 bg-white/20"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.42, delay: 0.08, ease: lineEase }}
                />
                <motion.img
                  src="/favicon-192.png"
                  alt=""
                  className="size-9 rounded-md"
                  initial={{ opacity: 0, rotate: -8, scale: 0.86 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  transition={{ duration: 0.48, delay: 0.16, ease: lineEase }}
                />
                <motion.span
                  className="h-px w-12 bg-white/20"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.42, delay: 0.08, ease: lineEase }}
                />
              </div>

              <div className="relative mx-auto w-fit overflow-hidden px-1">
                <motion.h1
                  className="font-display text-5xl font-black uppercase tracking-[-0.04em] sm:text-7xl"
                  initial={{ opacity: 0, letterSpacing: "0.06em", y: 8 }}
                  animate={{ opacity: 1, letterSpacing: "-0.04em", y: 0 }}
                  transition={{ duration: 0.55, delay: 0.18, ease: lineEase }}
                >
                  Roomzly
                </motion.h1>
                <motion.span
                  className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent"
                  animate={{ x: ["0%", "430%"] }}
                  transition={{ duration: 1.55, repeat: Infinity, repeatDelay: 0.35, ease: "easeInOut" }}
                />
              </div>

              <motion.p
                className="mx-auto mt-4 max-w-xs font-mono text-[10px] uppercase tracking-[0.28em] text-white/50"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.36, delay: 0.32, ease: lineEase }}
              >
                {message}
              </motion.p>

              <div className="mx-auto mt-9 w-full max-w-64">
                <div className="mb-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.22em] text-white/35">
                  <span>Verified</span>
                  <span>Spaces</span>
                </div>
                <div className="relative h-px overflow-hidden bg-white/15">
                  <motion.span
                    className="absolute inset-y-0 left-0 w-1/2 bg-accent"
                    animate={{ x: ["-120%", "240%"] }}
                    transition={{ duration: 1.25, repeat: Infinity, ease: [0.65, 0, 0.35, 1] }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ArchitecturalField() {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(24,128,255,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.05),transparent_38%)]" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:64px_64px]" />
      <motion.div
        className="absolute left-[14%] top-[18%] h-px w-[72%] bg-white/15"
        initial={{ scaleX: 0, transformOrigin: "left" }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.9, ease: lineEase }}
      />
      <motion.div
        className="absolute bottom-[20%] left-[18%] h-px w-[64%] bg-white/10"
        initial={{ scaleX: 0, transformOrigin: "right" }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.9, delay: 0.08, ease: lineEase }}
      />
      <motion.div
        className="absolute left-[22%] top-[12%] h-[76%] w-px bg-white/10"
        initial={{ scaleY: 0, transformOrigin: "top" }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.9, delay: 0.12, ease: lineEase }}
      />
      <motion.div
        className="absolute right-[24%] top-[16%] h-[68%] w-px bg-white/10"
        initial={{ scaleY: 0, transformOrigin: "bottom" }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.9, delay: 0.16, ease: lineEase }}
      />
    </div>
  );
}
