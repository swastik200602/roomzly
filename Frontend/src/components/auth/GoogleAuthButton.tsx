import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { authApi, type UserRole } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/stores/auth";
import { usePremiumLoading } from "@/stores/loading";
import { RoomzlyActionMark } from "@/components/ui/action-feedback";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

let googleScriptPromise: Promise<void> | undefined;

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://accounts.google.com/gsi/client"]',
      );
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return googleScriptPromise;
}

export function GoogleAuthButton({ role = "RESIDENT" }: { role?: UserRole }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const setSession = useAuth((s) => s.setSession);
  const showPremiumLoading = usePremiumLoading((s) => s.show);
  const hidePremiumLoading = usePremiumLoading((s) => s.hideAfterMinimum);
  const [available, setAvailable] = useState(true);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        const [{ googleClientId }] = await Promise.all([authApi.config(), loadGoogleScript()]);
        if (cancelled || !mountRef.current) return;
        if (!googleClientId || !window.google?.accounts?.id) {
          setAvailable(false);
          return;
        }

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async ({ credential }) => {
            if (!credential) {
              toast.error("Google did not return a credential");
              return;
            }
            setPending(true);
            showPremiumLoading("Verifying your Google sign-in...");
            try {
              const session = await authApi.google({ credential, role });
              setSession(session);
              toast.success("Signed in with Google");
              navigate({ to: "/dashboard" });
              hidePremiumLoading();
            } catch (error) {
              toast.error(error instanceof ApiError ? error.message : "Google sign-in failed");
              setPending(false);
              hidePremiumLoading();
            }
          },
        });

        mountRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(mountRef.current, {
          theme: "outline",
          size: "large",
          width: mountRef.current.clientWidth || 320,
          text: "continue_with",
        });
        setReady(true);
      } catch {
        if (!cancelled) setAvailable(false);
      }
    }

    setup();
    return () => {
      cancelled = true;
    };
  }, [navigate, role, setSession]);

  if (!available) {
    return (
      <button
        type="button"
        disabled
        className="w-full border border-white/10 text-white/35 py-3 text-sm font-medium rounded-sm"
      >
        Google sign-in unavailable
      </button>
    );
  }

  return (
    <div className="relative min-h-11">
      {(!ready || pending) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-sm border border-white/10 bg-neutral-950 text-sm font-semibold text-white light:border-neutral-200 light:bg-white light:text-neutral-950">
          <RoomzlyActionMark />
          {pending ? "Opening Roomzly" : "Preparing Google sign-in"}
        </div>
      )}
      <div ref={mountRef} className="w-full [&>div]:mx-auto" />
    </div>
  );
}
