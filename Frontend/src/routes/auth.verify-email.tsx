import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Mail, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/stores/auth";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/auth/verify-email")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Verify Email — Roomzly" }] }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const setSession = useAuth((s) => s.setSession);
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: (tok: string) => authApi.verifyEmail({ token: tok }),
    onSuccess: (session) => {
      setSession(session);
      toast.success("Email verified successfully! Welcome to Roomzly.");
      const redirectTimer = setTimeout(() => {
        navigate({ to: session.user.role === "OWNER" ? "/dashboard/settings" : "/dashboard" });
      }, 2000);
      return () => clearTimeout(redirectTimer);
    },
  });

  useEffect(() => {
    if (token && !verifyMutation.isSuccess && !verifyMutation.isPending && !verifyMutation.isError) {
      verifyMutation.mutate(token);
    }
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim() || resending) return;
    setResending(true);
    try {
      const res = await authApi.resendVerification({ email: resendEmail.trim() });
      toast.success(res.message || "A new verification link has been sent to your email!");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to resend verification email");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-dvh grid place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-md border border-border bg-surface p-8 rounded-sm">
        {/* State 1: Verifying */}
        {verifyMutation.isPending && (
          <div className="text-center py-6 space-y-4">
            <div className="size-12 rounded-full bg-accent/15 border border-accent/30 grid place-items-center text-accent mx-auto animate-pulse">
              <Loader2 className="size-6 animate-spin" />
            </div>
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-bold tracking-tight">Verifying your email</h1>
              <p className="text-xs text-muted-foreground">Confirming your credentials with Roomzly security...</p>
            </div>
          </div>
        )}

        {/* State 2: Success */}
        {verifyMutation.isSuccess && (
          <div className="text-center py-6 space-y-5">
            <div className="size-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 grid place-items-center text-emerald-500 mx-auto">
              <CheckCircle2 className="size-7" />
            </div>
            <div className="space-y-1.5">
              <span className="text-mono-eyebrow text-emerald-500">Email Verified</span>
              <h1 className="font-display text-3xl font-bold tracking-tighter">Welcome to Roomzly</h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your email address has been confirmed. You now have full verified access to listings, student chats, and bookings.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/dashboard"
                className="w-full bg-accent text-accent-foreground py-3 text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-accent/90 transition-colors inline-flex items-center justify-center gap-2"
              >
                Go to Dashboard <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* State 3: Error / Expired */}
        {verifyMutation.isError && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-destructive">
              <div className="size-10 rounded-full bg-destructive/15 border border-destructive/30 grid place-items-center">
                <XCircle className="size-5" />
              </div>
              <div>
                <span className="text-mono-eyebrow text-destructive">Verification Failed</span>
                <h1 className="font-display text-xl font-bold tracking-tight">Link Expired or Invalid</h1>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {verifyMutation.error instanceof ApiError
                ? verifyMutation.error.message
                : "This verification link has expired or has already been used. Please request a fresh verification link below."}
            </p>

            <form onSubmit={handleResend} className="space-y-3 pt-2 border-t border-border">
              <label className="block">
                <span className="text-mono-eyebrow block mb-1.5">Your email address</span>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="w-full h-10 bg-background border border-border px-3 text-xs rounded-sm focus:outline-none focus:border-accent"
                />
              </label>
              <button
                type="submit"
                disabled={resending}
                className="w-full bg-foreground text-background py-2.5 text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-foreground/90 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={cn("size-3", resending && "animate-spin")} />
                {resending ? "Sending..." : "Send new verification link"}
              </button>
            </form>

            <div className="text-center pt-2">
              <Link to="/auth/login" className="text-xs text-muted-foreground hover:text-foreground font-mono uppercase tracking-wider">
                &larr; Return to Sign in
              </Link>
            </div>
          </div>
        )}

        {/* State 4: No token provided in URL */}
        {!token && !verifyMutation.isPending && !verifyMutation.isSuccess && !verifyMutation.isError && (
          <div className="space-y-6">
            <div className="size-12 rounded-full bg-accent/15 border border-accent/30 grid place-items-center text-accent">
              <Mail className="size-6" />
            </div>

            <div className="space-y-1">
              <span className="text-mono-eyebrow text-accent">Account Activation</span>
              <h1 className="font-display text-2xl font-bold tracking-tight">Verify Your Email</h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Enter your registered email address below to receive a new verification link.
              </p>
            </div>

            <form onSubmit={handleResend} className="space-y-3">
              <label className="block">
                <span className="text-mono-eyebrow block mb-1.5">Registered Email</span>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="w-full h-10 bg-background border border-border px-3 text-xs rounded-sm focus:outline-none focus:border-accent"
                />
              </label>
              <button
                type="submit"
                disabled={resending}
                className="w-full bg-accent text-accent-foreground py-2.5 text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-accent/90 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={cn("size-3", resending && "animate-spin")} />
                {resending ? "Sending..." : "Send Verification Link"}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-border">
              <Link to="/auth/login" className="text-xs text-muted-foreground hover:text-foreground font-mono uppercase tracking-wider">
                &larr; Back to Sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
