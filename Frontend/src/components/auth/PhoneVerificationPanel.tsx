import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Clock, Phone } from "lucide-react";
import { toast } from "sonner";

import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useAuth } from "@/stores/auth";

function normalizePhone(value: string) {
  const cleaned = value.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`;
  return cleaned;
}

export function PhoneVerificationPanel({
  phoneNumber,
  compact = false,
  onVerified,
}: {
  phoneNumber: string;
  compact?: boolean;
  onVerified?: () => void;
}) {
  const accessToken = useAuth((state) => state.accessToken);
  const setSession = useAuth((state) => state.setSession);
  const user = useAuth((state) => state.user);
  const normalizedPhone = normalizePhone(phoneNumber);
  const submittedPhone = user?.phoneNumber ?? user?.phone ?? "";
  const hasPendingPhone = Boolean(submittedPhone) && !user?.phoneVerified;

  const submitMutation = useMutation({
    mutationFn: authApi.verifyPhone,
    onSuccess: (updated) => {
      if (accessToken) setSession({ user: updated, accessToken });
      toast.success("Phone submitted for admin verification");
      onVerified?.();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Phone could not be submitted");
    },
  });

  if (user?.role !== "OWNER") return null;

  if (user.phoneVerified) {
    return (
      <div className={cn("border border-emerald-500/30 bg-emerald-500/10 rounded-sm p-4 flex items-center gap-3", compact && "p-3")}>
        <CheckCircle2 className="size-5 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold">Mobile verified</p>
          <p className="text-xs text-muted-foreground">{submittedPhone || normalizedPhone}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border border-border rounded-sm p-4 space-y-3 bg-surface", compact && "p-3")}>
      <div className="flex items-start gap-3">
        {hasPendingPhone ? (
          <Clock className="size-5 mt-0.5 text-accent" />
        ) : (
          <Phone className="size-5 mt-0.5 text-muted-foreground" />
        )}
        <div>
          <p className="text-sm font-semibold">
            {hasPendingPhone ? "Mobile verification pending" : "Submit mobile for verification"}
          </p>
          <p className="text-xs text-muted-foreground">
            Owners must have an admin-verified mobile number before publishing listings. Roomzly may verify this by WhatsApp or call.
          </p>
        </div>
      </div>
      {hasPendingPhone && (
        <p className="text-xs border border-border bg-background px-3 py-2 rounded-sm">
          Submitted number: <span className="font-mono">{submittedPhone}</span>
        </p>
      )}
      <button
        type="button"
        onClick={() => submitMutation.mutate({ phoneNumber: normalizedPhone })}
        disabled={submitMutation.isPending || !phoneNumber || normalizedPhone.length < 10}
        className="px-3 py-2 bg-foreground text-background rounded-sm font-mono text-[10px] uppercase tracking-widest disabled:opacity-60"
      >
        {submitMutation.isPending ? "Submitting" : hasPendingPhone ? "Resubmit number" : "Submit for review"}
      </button>
    </div>
  );
}
