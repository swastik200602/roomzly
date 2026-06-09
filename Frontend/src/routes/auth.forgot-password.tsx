import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export const Route = createFileRoute("/auth/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password - Roomzly" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const mutation = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => {
      toast.success("If an account exists, reset instructions have been sent");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Password reset request failed");
    },
  });

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutation.mutate({ email: String(form.get("email") ?? "") });
  };

  return (
    <div className="min-h-dvh grid place-items-center bg-background px-4">
      <div className="w-full max-w-sm border border-border bg-surface p-6">
        <Link to="/auth/login" className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="size-3.5" /> Sign in
        </Link>
        <p className="text-mono-eyebrow mb-2">Password recovery</p>
        <h1 className="font-display text-3xl font-bold tracking-tighter mb-6">Reset access</h1>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-mono-eyebrow block mb-2">Email</span>
            <input
              required
              type="email"
              name="email"
              className="w-full h-11 bg-background border border-border px-3 text-sm rounded-sm focus:outline-none focus:border-accent"
              placeholder="you@example.com"
            />
          </label>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-accent text-accent-foreground py-3 text-sm font-bold uppercase tracking-widest rounded-sm inline-flex items-center justify-center gap-2"
          >
            <Mail className="size-4" />
            {mutation.isPending ? "Sending..." : "Send reset link"}
          </button>
        </form>
      </div>
    </div>
  );
}
