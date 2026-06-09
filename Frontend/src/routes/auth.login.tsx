import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import p1 from "@/assets/property-1.jpg";
import p3 from "@/assets/property-3.jpg";
import p6 from "@/assets/property-6.jpg";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { propertiesApi } from "@/lib/api/properties";
import { useAuth } from "@/stores/auth";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Sign in - Roomzly" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuth((s) => s.setSession);
  const facetsQuery = useQuery({ queryKey: ["properties", "facets"], queryFn: propertiesApi.facets });
  const facets = facetsQuery.data;
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (session) => {
      setSession(session);
      toast.success("Signed in");
      navigate({ to: "/dashboard" });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Sign in failed");
    },
  });

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    loginMutation.mutate({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
  };

  return (
    <div className="min-h-dvh relative flex items-center justify-center overflow-hidden px-4 py-10">

      {/* Full-screen mosaic background */}
      <div className="absolute inset-0 grid grid-cols-3 gap-0.5 bg-black">
        <div className="relative overflow-hidden">
          <img src={p1} alt="" className="absolute inset-0 size-full object-cover" />
        </div>
        <div className="relative overflow-hidden">
          <img src={p3} alt="" className="absolute inset-0 size-full object-cover" />
        </div>
        <div className="relative overflow-hidden">
          <img src={p6} alt="" className="absolute inset-0 size-full object-cover" />
        </div>
      </div>

      {/* Scrim */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Vertical brand text — desktop only */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center gap-4">
        <div className="w-px h-20 bg-white/20" />
        <p
          className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/25"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          Premium Real Estate · Since 2026
        </p>
        <div className="w-px h-20 bg-white/20" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[420px]">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
            Member access
          </p>
          <Link
            to="/auth/signup"
            className="font-mono text-[10px] uppercase tracking-widest text-white/50 hover:text-white transition-colors border border-white/15 px-3 py-1.5 rounded-sm hover:border-white/30"
          >
            New? Sign up →
          </Link>
        </div>

        {/* Glass panel */}
        <div className="bg-white/95 text-neutral-950 border border-white/40 rounded-sm p-6 sm:p-8 shadow-2xl dark:bg-neutral-950/90 dark:text-white dark:border-white/10">
          <p className="text-mono-eyebrow text-neutral-500 mb-2 dark:text-white/45">Welcome back</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tighter text-neutral-950 mb-1 dark:text-white">
            Sign in.
          </h1>
          <p className="text-sm text-neutral-500 mb-7 dark:text-white/45">
            Your portfolio is waiting.
          </p>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-mono-eyebrow text-neutral-600 block mb-2 dark:text-white/45">Email</label>
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                className="w-full h-11 bg-neutral-50 border border-neutral-200 text-neutral-950 placeholder:text-neutral-400 px-3 text-sm rounded-sm focus:outline-none focus:border-accent focus:bg-white transition-all dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/25 dark:focus:bg-white/10"
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-mono-eyebrow text-neutral-600 dark:text-white/45">Password</label>
                <Link to="/auth/forgot-password" className="font-mono text-[10px] uppercase tracking-widest text-accent hover:text-accent/70 transition-colors">
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full h-11 bg-neutral-50 border border-neutral-200 text-neutral-950 placeholder:text-neutral-400 px-3 text-sm rounded-sm focus:outline-none focus:border-accent focus:bg-white transition-all dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/25 dark:focus:bg-white/10"
              />
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-accent text-accent-foreground py-3 text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-accent/90 transition-all mt-1 inline-flex items-center justify-center gap-2 group"
            >
              {loginMutation.isPending ? "Signing in..." : "Continue"}
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 font-mono text-[10px] uppercase tracking-widest text-neutral-400 bg-white dark:bg-neutral-950">
                or
              </span>
            </div>
          </div>

          <GoogleAuthButton />
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-px mt-3 bg-white/5 border border-white/10 rounded-sm overflow-hidden">
          {[
            { v: String(facets?.total ?? 0), l: "Listings" },
            { v: String(facets?.verified ?? 0), l: "Verified" },
            { v: String(facets?.premium ?? 0), l: "Premium" },
          ].map((s) => (
            <div key={s.l} className="px-3 py-2.5 text-center">
              <p className="font-display text-sm font-bold text-white tracking-tighter">{s.v}</p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-white/25 mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
