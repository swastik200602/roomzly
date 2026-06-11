import { Link, useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  GitCompare,
  GraduationCap,
  Heart,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
} from "lucide-react";
import { memo } from "react";
import { toast } from "sonner";

import { ProgressiveImage } from "@/components/property/ProgressiveImage";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/currency";
import type { Property } from "@/lib/properties";
import { cn } from "@/lib/utils";
import { useAuth } from "@/stores/auth";
import { useCompare } from "@/stores/compare";
import { useWishlist } from "@/stores/wishlist";

interface Props {
  property: Property;
  index?: number;
}

function PropertyCardComponent({ property: p }: Props) {
  const navigate = useNavigate();
  const user = useAuth((state) => state.user);
  const wished = useWishlist((state) => state.ids.includes(p.id));
  const toggleWish = useWishlist((state) => state.toggle);
  const compared = useCompare((state) => state.ids.includes(p.id));
  const toggleCompare = useCompare((state) => state.toggle);

  const locationLabel = p.locality ?? p.neighborhood ?? p.city;
  const primaryCollege = p.primaryCollege ?? null;
  const trustCues = [
    p.owner.verified ? "Owner verified" : null,
    p.owner.phoneVerified ? "Mobile verified" : null,
    primaryCollege?.verifiedNearCampus ? "Verified near campus" : null,
  ].filter(Boolean) as string[];

  return (
    <article className="group">
      <Link
        to="/listing/$slug"
        params={{ slug: p.slug }}
        className="block rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative mb-5 aspect-[3/4] overflow-hidden border border-border bg-surface">
          {p.image ? (
            <ProgressiveImage
              src={p.image}
              alt={p.title}
              width={800}
              height={1066}
              wrapperClassName="absolute inset-0"
              className="object-cover group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-surface-hi text-mono-eyebrow">
              No image
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

          <span className="absolute bottom-3 left-3 text-[10px] font-mono tracking-wider text-foreground/60">
            {p.code}
          </span>

          <div className="absolute left-3 top-3 flex max-w-[calc(100%-4rem)] flex-wrap gap-1.5">
            {p.verified && (
              <Badge className="gap-1 rounded-none border-border bg-background px-2 py-1 font-mono text-[10px] uppercase tracking-tighter text-foreground">
                <BadgeCheck className="size-3" />
                Verified listing
              </Badge>
            )}
            {p.premium && (
              <Badge className="rounded-none border-transparent bg-accent px-2 py-1 font-mono text-[10px] uppercase tracking-tighter text-accent-foreground">
                Premium
              </Badge>
            )}
            {p.popularAmongStudents && (
              <Badge className="gap-1 rounded-none border-border bg-background px-2 py-1 font-mono text-[10px] uppercase tracking-tighter text-foreground">
                <GraduationCap className="size-3" />
                Student pick
              </Badge>
            )}
          </div>

          <TooltipProvider delayDuration={300}>
            <div className="absolute right-3 top-3 flex flex-col gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
                    aria-pressed={wished}
                    onClick={(event) => {
                      event.preventDefault();
                      if (!user) {
                        toast.error("Sign in to save properties");
                        navigate({ to: "/auth/login" });
                        return;
                      }
                      void toggleWish(p.id);
                    }}
                    className={cn(
                      "grid size-8 place-items-center border border-border transition-colors",
                      wished
                        ? "bg-accent text-accent-foreground"
                        : "bg-background/70 text-foreground hover:bg-background",
                    )}
                  >
                    <Heart className={cn("size-3.5", wished && "fill-current")} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{wished ? "Remove from wishlist" : "Save to wishlist"}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={compared ? "Remove from compare" : "Add to compare"}
                    aria-pressed={compared}
                    onClick={(event) => {
                      event.preventDefault();
                      toggleCompare(p.id);
                    }}
                    className={cn(
                      "grid size-8 place-items-center border border-border transition-colors",
                      compared
                        ? "border-accent bg-accent text-accent-foreground"
                        : "bg-background/70 text-foreground hover:bg-background",
                    )}
                  >
                    <GitCompare className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{compared ? "Remove from compare" : "Add to compare"}</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          {primaryCollege && (
            <div className="absolute bottom-8 left-3 right-3">
              <div className="inline-flex max-w-full items-center gap-2 border border-white/15 bg-background/90 px-2.5 py-1.5 text-[11px] font-medium text-foreground backdrop-blur-sm">
                <GraduationCap className="size-3.5 shrink-0 text-accent" />
                <span className="truncate">
                  {primaryCollege.shortName} - {primaryCollege.distanceKm} km from campus
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-1 truncate font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {locationLabel} / {p.city} / {p.categoryLabel}
            </p>
            <h3 className="line-clamp-2 text-base font-medium leading-tight transition-colors group-hover:text-accent">
              {p.title}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0" />
                {locationLabel}
              </span>
              {primaryCollege && (
                <span className="inline-flex items-center gap-1 text-foreground/80">
                  <GraduationCap className="size-3.5 shrink-0 text-accent" />
                  {primaryCollege.shortName}
                </span>
              )}
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              {p.beds} bed / {p.baths} bath / {p.sqft.toLocaleString()} sqft
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {trustCues.slice(0, 2).map((cue) => (
                <span
                  key={cue}
                  className="inline-flex items-center gap-1 border border-border bg-surface px-2 py-1 text-[11px] text-muted-foreground"
                >
                  <ShieldCheck className="size-3 shrink-0 text-accent" />
                  {cue}
                </span>
              ))}
              {p.studentFriendlyScore != null && (
                <span className="inline-flex items-center gap-1 border border-border bg-surface px-2 py-1 text-[11px] text-muted-foreground">
                  <GraduationCap className="size-3 shrink-0 text-accent" />
                  Student fit {p.studentFriendlyScore}/100
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 text-right font-mono">
            <div className="text-base font-bold">{formatCurrency(p.price)}</div>
            <div className="text-[10px] tracking-tight text-muted-foreground">{p.priceUnit}</div>
            <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Star className="size-3 fill-foreground text-foreground" />
              {p.rating}
            </div>
            <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Phone className="size-3" />
              {p.owner.responseRate}% response
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

export const PropertyCard = memo(PropertyCardComponent);
