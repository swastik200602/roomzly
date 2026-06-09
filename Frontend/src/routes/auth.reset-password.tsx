import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowLeft, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/auth/reset-password")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Reset password - Roomzly" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const mutation = useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => {
      toast.success("Password updated");
      navigate({ to: "/auth/login" });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Password reset failed");
    },
  });

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutation.mutate({
      token: String(form.get("token") ?? ""),
      password: String(form.get("password") ?? ""),
    });
  };

  return (
    <div className="min-h-dvh grid place-items-center bg-background px-4">
      <div className="w-full max-w-sm border border-border bg-surface p-6">
        <Link to="/auth/login" className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="size-3.5" /> Sign in
        </Link>
        <p className="text-mono-eyebrow mb-2">New credentials</p>
        <h1 className="font-display text-3xl font-bold tracking-tighter mb-6">Reset password</h1>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-mono-eyebrow block mb-2">Reset token</span>
            <input
              required
              name="token"
              defaultValue={token ?? ""}
              className="w-full h-11 bg-background border border-border px-3 text-sm rounded-sm focus:outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="text-mono-eyebrow block mb-2">New password</span>
            <input
              required
              minLength={8}
              type="password"
              name="password"
              className="w-full h-11 bg-background border border-border px-3 text-sm rounded-sm focus:outline-none focus:border-accent"
              placeholder="Min. 8 characters"
            />
          </label>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-accent text-accent-foreground py-3 text-sm font-bold uppercase tracking-widest rounded-sm inline-flex items-center justify-center gap-2"
          >
            <KeyRound className="size-4" />
            {mutation.isPending ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
