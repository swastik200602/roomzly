import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { authApi, type UserRole } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/stores/auth";

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
  const [available, setAvailable] = useState(true);

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
            try {
              const session = await authApi.google({ credential, role });
              setSession(session);
              toast.success("Signed in with Google");
              navigate({ to: "/dashboard" });
            } catch (error) {
              toast.error(error instanceof ApiError ? error.message : "Google sign-in failed");
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

  return <div ref={mountRef} className="w-full [&>div]:mx-auto" />;
}
