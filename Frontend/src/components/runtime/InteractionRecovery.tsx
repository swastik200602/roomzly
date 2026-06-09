import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

function hasOpenModal() {
  if (typeof document === "undefined") return false;
  return Boolean(
    document.querySelector(
      '[role="dialog"][aria-modal="true"], [data-radix-dialog-content][data-state="open"]',
    ),
  );
}

function recoverPageInteractions() {
  if (typeof document === "undefined" || hasOpenModal()) return;

  const body = document.body;
  const root = document.getElementById("root");

  if (body.style.pointerEvents === "none") body.style.pointerEvents = "";
  if (body.style.overflow === "hidden") body.style.overflow = "";
  if (document.documentElement.style.overflow === "hidden") {
    document.documentElement.style.overflow = "";
  }

  root?.removeAttribute("aria-hidden");
  root?.removeAttribute("inert");
}

export function InteractionRecovery() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    recoverPageInteractions();
    const timeoutId = window.setTimeout(recoverPageInteractions, 0);
    const frameId = window.requestAnimationFrame(recoverPageInteractions);

    return () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(frameId);
    };
  }, [pathname]);

  useEffect(() => {
    const recoverSoon = () => {
      window.requestAnimationFrame(recoverPageInteractions);
    };

    window.addEventListener("focusin", recoverSoon, { capture: true, passive: true });
    window.addEventListener("pointerdown", recoverSoon, { capture: true, passive: true });

    return () => {
      window.removeEventListener("focusin", recoverSoon, { capture: true });
      window.removeEventListener("pointerdown", recoverSoon, { capture: true });
    };
  }, []);

  return null;
}
