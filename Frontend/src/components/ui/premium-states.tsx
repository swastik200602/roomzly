import { Home, MapPin, RefreshCw, Search } from "lucide-react";

import { cn } from "@/lib/utils";

type PremiumStateProps = {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function RoomzlyEmptyState({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: PremiumStateProps) {
  return (
    <div className={cn("border border-border bg-surface p-8 text-center sm:p-12", className)}>
      <HousePinIllustration />
      <p className="text-mono-eyebrow mb-3 mt-6">{eyebrow}</p>
      <h3 className="font-display text-2xl tracking-tight">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-7 inline-flex min-h-10 items-center justify-center rounded-sm bg-foreground px-5 text-sm font-semibold text-background transition-opacity hover:opacity-85"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function RoomzlyErrorState({
  eyebrow = "Recovery ready",
  title,
  description,
  actionLabel = "Try again",
  onAction,
  className,
}: Partial<PremiumStateProps> & Pick<PremiumStateProps, "title" | "description">) {
  return (
    <div className={cn("border border-border bg-surface p-8 text-center sm:p-12", className)}>
      <div className="mx-auto grid size-16 place-items-center rounded-full border border-border bg-background">
        <RefreshCw className="size-6 text-accent" />
      </div>
      <p className="text-mono-eyebrow mb-3 mt-6">{eyebrow}</p>
      <h3 className="font-display text-2xl tracking-tight">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-7 inline-flex min-h-10 items-center justify-center rounded-sm bg-foreground px-5 text-sm font-semibold text-background transition-opacity hover:opacity-85"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function LocationScanningState({ message = "Searching verified spaces..." }: { message?: string }) {
  return (
    <div className="border border-border bg-surface p-6">
      <div className="flex items-center gap-4">
        <div className="relative grid size-14 shrink-0 place-items-center">
          <span className="roomzly-scan-ring absolute inset-0 rounded-full border border-accent/40" />
          <span className="roomzly-scan-ring absolute inset-2 rounded-full border border-accent/25 [animation-delay:180ms]" />
          <MapPin className="relative size-6 text-accent" />
        </div>
        <div>
          <p className="text-sm font-semibold">{message}</p>
          <p className="mt-1 text-xs text-muted-foreground">Keeping your current matches visible while Roomzly checks live availability.</p>
        </div>
      </div>
    </div>
  );
}

function HousePinIllustration() {
  return (
    <div className="relative mx-auto grid size-24 place-items-center">
      <div className="absolute inset-0 rounded-full border border-border bg-background" />
      <Home className="relative size-9 text-foreground" />
      <div className="absolute bottom-4 right-4 grid size-8 place-items-center rounded-full bg-accent text-accent-foreground">
        <Search className="size-4" />
      </div>
    </div>
  );
}
