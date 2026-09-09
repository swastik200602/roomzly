import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import p2 from "@/assets/property-2.jpg";
import p4 from "@/assets/property-4.jpg";
import p5 from "@/assets/property-5.jpg";
import { authApi, type UserRole } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { usePremiumLoading } from "@/stores/loading";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { ActionButtonContent } from "@/components/ui/action-feedback";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth/signup")({
  head: () => ({ meta: [{ title: "Create an account — Roomzly" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const showPremiumLoading = usePremiumLoading((s) => s.show);
  const hidePremiumLoading = usePremiumLoading((s) => s.hideAfterMinimum);
  const [role, setRole] = useState<UserRole>("RESIDENT");
  const [verificationSentEmail, setVerificationSentEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const signupMutation = useMutation({
    mutationFn: authApi.register,
    onMutate: () => {
      showPremiumLoading("Sending verification link...");
    },
    onSuccess: (data) => {
      setVerificationSentEmail(data.email);
      toast.success("Verification link sent! Please check your email to complete signup.");
      hidePremiumLoading();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Account creation failed");
      hidePremiumLoading();
    },
  });

  const handleResend = async () => {
    if (!verificationSentEmail || resending) return;
    setResending(true);
    try {
      const res = await authApi.resendVerification({ email: verificationSentEmail });
      toast.success(res.message || "A new verification link has been sent to your email!");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to resend verification email");
    } finally {
      setResending(false);
    }
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const role = String(form.get("role") ?? "resident").toUpperCase() as UserRole;
    signupMutation.mutate({
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      phoneNumber: String(form.get("phoneNumber") ?? "") || undefined,
      role,
    });
  };

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row">

      {/* Left image panel — hidden on mobile, visible lg+ */}
      <div className="hidden lg:flex flex-col w-[42%] xl:w-[45%] relative overflow-hidden shrink-0">

        {/* Vertical image strips */}
        <div className="absolute inset-0 flex flex-col gap-0.5">
          <div className="flex-1 relative overflow-hidden">
            <img src={p2} alt="" className="absolute inset-0 size-full object-cover" />
          </div>
          <div className="flex-1 relative overflow-hidden">
            <img src={p4} alt="" className="absolute inset-0 size-full object-cover" />
          </div>
          <div className="flex-1 relative overflow-hidden">
            <img src={p5} alt="" className="absolute inset-0 size-full object-cover" />
          </div>
        </div>

        {/* Dark overlay — strong enough to make text readable */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10">
          <div className="flex items-center gap-3">
            <div className="w-6 h-px bg-white/30" />
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/50">
              The considered way to live
            </p>
          </div>

          <div>
            <h2 className="font-display text-4xl xl:text-5xl font-bold tracking-tighter text-white leading-[1.0] mb-8">
              Find spaces<br />
              <span className="text-white/50">worth keeping.</span>
            </h2>
            <div className="flex flex-col gap-4">
              {[
                "Verified properties from real Roomzly owners",
                "Direct owner contact from your dashboard",
                "Bookings, messages, and saves stored in your account",
              ].map((t) => (
                <div key={t} className="flex items-start gap-3">
                  <span className="size-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
                  <p className="text-sm text-white/80 leading-relaxed">{t}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="font-mono text-[9px] uppercase tracking-widest text-white/25">
            © 2026 Roomzly International Inc.
          </p>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 bg-background flex flex-col justify-center px-5 py-10 sm:px-10 md:px-16 min-h-dvh lg:min-h-0 overflow-y-auto">

        {/* Mobile image strip */}
        <div className="lg:hidden grid grid-cols-3 gap-1 mb-8 h-32 rounded-sm overflow-hidden">
          <div className="relative overflow-hidden">
            <img src={p2} alt="" className="absolute inset-0 size-full object-cover" />
          </div>
          <div className="relative overflow-hidden">
            <img src={p4} alt="" className="absolute inset-0 size-full object-cover" />
          </div>
          <div className="relative overflow-hidden">
            <img src={p5} alt="" className="absolute inset-0 size-full object-cover" />
          </div>
        </div>

        <div className="w-full max-w-sm mx-auto">
          {verificationSentEmail ? (
            <div className="space-y-6">
              <div className="size-12 rounded-full bg-accent/15 border border-accent/30 grid place-items-center text-accent">
                <Mail className="size-6" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-mono-eyebrow text-accent">Verification link sent</span>
                </div>
                <h1 className="font-display text-3xl sm:text-4xl tracking-tighter font-bold mb-2">
                  Check your<br />inbox.
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We sent a verification link to activate your Roomzly account:
                </p>
              </div>

              <div className="border border-border bg-surface p-3.5 rounded-sm">
                <p className="font-mono text-xs text-foreground font-semibold break-all">
                  {verificationSentEmail}
                </p>
              </div>

              <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-accent shrink-0 mt-0.5" />
                  <span>Click the link in the email to confirm your email and activate your account.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-accent shrink-0 mt-0.5" />
                  <span>Didn't see it? Check your Spam, Junk, or Promotions folder.</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full border border-border bg-surface hover:bg-surface-hi py-2.5 text-xs font-bold uppercase tracking-widest rounded-sm transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={cn("size-3.5", resending && "animate-spin")} />
                  {resending ? "Sending new link..." : "Resend verification email"}
                </button>

                <Link
                  to="/auth/login"
                  className="w-full block text-center py-2 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  Already verified? Sign in &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-px bg-accent" />
                <p className="text-mono-eyebrow">Join the index</p>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tighter font-bold mb-1">
                Create<br />account.
              </h1>
              <p className="text-sm text-muted-foreground mb-8">
                Discover, list, and live — considered.
              </p>

              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-mono-eyebrow block mb-2">First name</span>
                    <input
                      type="text"
                      name="firstName"
                      required
                      placeholder="Ada"
                      className="w-full h-11 bg-surface border border-border px-3 text-sm rounded-sm focus:outline-none focus:border-accent transition-colors"
                    />
                  </label>
                  <label className="block">
                    <span className="text-mono-eyebrow block mb-2">Last name</span>
                    <input
                      type="text"
                      name="lastName"
                      required
                      placeholder="Lovelace"
                      className="w-full h-11 bg-surface border border-border px-3 text-sm rounded-sm focus:outline-none focus:border-accent transition-colors"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-mono-eyebrow block mb-2">Email</span>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="you@example.com"
                    className="w-full h-11 bg-surface border border-border px-3 text-sm rounded-sm focus:outline-none focus:border-accent transition-colors"
                  />
                </label>
                <label className="block">
                  <span className="text-mono-eyebrow block mb-2">Phone number</span>
                  <input
                    type="tel"
                    name="phoneNumber"
                    required={role === "OWNER"}
                    placeholder="+91 98765 43210"
                    className="w-full h-11 bg-surface border border-border px-3 text-sm rounded-sm focus:outline-none focus:border-accent transition-colors"
                  />
                  <span className="text-xs text-muted-foreground mt-1.5 block">
                    Required only for owners before publishing listings.
                  </span>
                </label>
                <label className="block">
                  <span className="text-mono-eyebrow block mb-2">Password</span>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="Min. 8 characters"
                    className="w-full h-11 bg-surface border border-border px-3 text-sm rounded-sm focus:outline-none focus:border-accent transition-colors"
                  />
                </label>

                <div>
                  <span className="text-mono-eyebrow block mb-2">I am a</span>
                  <div className="grid grid-cols-2 gap-2">
                    {["Resident", "Owner"].map((r) => (
                      <label
                        key={r}
                        className="flex items-center gap-2.5 border border-border px-3 py-2.5 rounded-sm cursor-pointer hover:border-accent/50 hover:bg-surface-hi transition-colors has-[:checked]:border-accent has-[:checked]:bg-surface-hi"
                      >
                        <input
                          type="radio"
                          name="role"
                          value={r.toLowerCase()}
                          className="accent-accent"
                          defaultChecked={r === "Resident"}
                          onChange={() => setRole(r.toUpperCase() as UserRole)}
                        />
                        <span className="text-sm font-medium">{r}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={signupMutation.isPending}
                  className="w-full bg-accent text-accent-foreground py-3 text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-accent/90 transition-all mt-1 inline-flex items-center justify-center gap-2 group"
                >
                  <ActionButtonContent
                    pending={signupMutation.isPending}
                    idleLabel="Create account"
                    pendingLabel="Building your space"
                    icon={<ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />}
                  />
                </button>
              </form>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground bg-background">
                    or
                  </span>
                </div>
              </div>

              <GoogleAuthButton role={role} />

              <p className="text-xs text-muted-foreground mt-5 leading-relaxed">
                By signing up you agree to our{" "}
                <a href="#" className="text-foreground hover:text-accent underline-offset-4 hover:underline">Terms</a>
                {" & "}
                <a href="#" className="text-foreground hover:text-accent underline-offset-4 hover:underline">Privacy</a>.
              </p>

              <div className="mt-5 pt-5 border-t border-border">
                <p className="text-sm text-muted-foreground text-center">
                  Already have an account?{" "}
                  <Link to="/auth/login" className="text-foreground font-semibold hover:text-accent underline-offset-4 hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
