import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, GraduationCap, Home, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import p1 from "@/assets/property-1.jpg";
import p3 from "@/assets/property-3.jpg";
import p6 from "@/assets/property-6.jpg";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { propertiesApi } from "@/lib/api/properties";
import { useAuth } from "@/stores/auth";
import { usePremiumLoading } from "@/stores/loading";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { ActionButtonContent } from "@/components/ui/action-feedback";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Sign in - Roomzly" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuth((s) => s.setSession);
  const showPremiumLoading = usePremiumLoading((s) => s.show);
  const hidePremiumLoading = usePremiumLoading((s) => s.hideAfterMinimum);
  const facetsQuery = useQuery({ queryKey: ["properties", "facets"], queryFn: propertiesApi.facets });
  const facets = facetsQuery.data;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onMutate: () => {
      showPremiumLoading("Opening your Roomzly space...");
    },
    onSuccess: (session) => {
      setSession(session);
      toast.success("Signed in successfully");
      navigate({ to: "/dashboard" });
      hidePremiumLoading();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Sign in failed");
      hidePremiumLoading();
    },
  });

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loginMutation.mutate({
      email: email.trim(),
      password,
    });
  };

  const handleDemoLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    loginMutation.mutate({
      email: demoEmail,
      password: demoPass,
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
        <div className="rounded-sm border border-white/10 bg-neutral-950/90 p-6 text-white shadow-2xl sm:p-8 light:border-white/40 light:bg-white/95 light:text-neutral-950">
          <p className="text-mono-eyebrow mb-2 text-white/45 light:text-neutral-500">Welcome back</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tighter text-white mb-1 light:text-neutral-950">
            Sign in.
          </h1>
          <p className="text-sm text-white/45 mb-5 light:text-neutral-500">
            Access verified student PGs and housing.
          </p>

          {/* Quick Demo Access for Recruiters & Testing */}
          <div className="mb-6 rounded-md border border-accent/30 bg-accent/10 p-3 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                <Sparkles className="size-3" /> Quick Demo Access
              </span>
              <span className="font-mono text-[9px] text-white/50 light:text-neutral-500">1-click test login</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleDemoLogin("resident@roomzly.test", "Password123!")}
                disabled={loginMutation.isPending}
                className="flex flex-col items-center justify-center rounded border border-white/10 bg-white/5 py-2 px-1 hover:bg-white/15 hover:border-accent transition-all text-center group cursor-pointer"
              >
                <GraduationCap className="size-4 mb-1 text-accent group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-semibold text-white light:text-neutral-900 leading-tight">Student</span>
                <span className="font-mono text-[8px] text-white/40 light:text-neutral-500">Resident</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin("owner@roomzly.test", "Password123!")}
                disabled={loginMutation.isPending}
                className="flex flex-col items-center justify-center rounded border border-white/10 bg-white/5 py-2 px-1 hover:bg-white/15 hover:border-accent transition-all text-center group cursor-pointer"
              >
                <Home className="size-4 mb-1 text-accent group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-semibold text-white light:text-neutral-900 leading-tight">Landlord</span>
                <span className="font-mono text-[8px] text-white/40 light:text-neutral-500">PG Owner</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin("admin@roomzly.test", "Password123!")}
                disabled={loginMutation.isPending}
                className="flex flex-col items-center justify-center rounded border border-white/10 bg-white/5 py-2 px-1 hover:bg-white/15 hover:border-accent transition-all text-center group cursor-pointer"
              >
                <ShieldCheck className="size-4 mb-1 text-accent group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-semibold text-white light:text-neutral-900 leading-tight">Admin</span>
                <span className="font-mono text-[8px] text-white/40 light:text-neutral-500">Moderator</span>
              </button>
            </div>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-mono-eyebrow text-white/45 block mb-2 light:text-neutral-600">Email</label>
              <input
                type="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 bg-white/5 border border-white/10 text-white placeholder:text-white/25 px-3 text-sm rounded-sm focus:outline-none focus:border-accent focus:bg-white/10 transition-all light:bg-neutral-50 light:border-neutral-200 light:text-neutral-950 light:placeholder:text-neutral-400 light:focus:bg-white"
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-mono-eyebrow text-white/45 light:text-neutral-600">Password</label>
                <Link to="/auth/forgot-password" className="font-mono text-[10px] uppercase tracking-widest text-accent hover:text-accent/70 transition-colors">
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                name="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 bg-white/5 border border-white/10 text-white placeholder:text-white/25 px-3 text-sm rounded-sm focus:outline-none focus:border-accent focus:bg-white/10 transition-all light:bg-neutral-50 light:border-neutral-200 light:text-neutral-950 light:placeholder:text-neutral-400 light:focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-accent text-accent-foreground py-3 text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-accent/90 transition-all mt-1 inline-flex items-center justify-center gap-2 group"
            >
              <ActionButtonContent
                pending={loginMutation.isPending}
                idleLabel="Continue"
                pendingLabel="Opening Roomzly"
                icon={<ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />}
              />
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10 light:border-neutral-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 font-mono text-[10px] uppercase tracking-widest text-white/35 bg-neutral-950 light:bg-white light:text-neutral-400">
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
