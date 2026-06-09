import { Link } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { Heart, GitCompare, BadgeCheck, Star } from "lucide-react";
import { memo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/stores/wishlist";
import { useCompare } from "@/stores/compare";
import { useAuth } from "@/stores/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Property } from "@/lib/properties";
import { formatCurrency } from "@/lib/currency";

interface Props {
  property: Property;
  index?: number;
}

function PropertyCardComponent({ property: p }: Props) {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const wished = useWishlist((s) => s.ids.includes(p.id));
  const toggleWish = useWishlist((s) => s.toggle);
  const compared = useCompare((s) => s.ids.includes(p.id));
  const toggleComp = useCompare((s) => s.toggle);

  return (
    <article className="group">
      <Link
        to="/listing/$slug"
        params={{ slug: p.slug }}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-surface mb-5 border border-border">
          <ImageWithSkeleton src={p.image} alt={p.title} />
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Code stamp */}
          <span className="absolute bottom-3 left-3 text-[10px] font-mono text-foreground/60 tracking-wider">
            {p.code}
          </span>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            {p.verified && (
              <Badge className="bg-background text-foreground border-border font-mono text-[10px] uppercase tracking-tighter rounded-none px-2 py-1 gap-1">
                <BadgeCheck className="size-3" />
                Verified
              </Badge>
            )}
            {p.premium && (
              <Badge className="bg-accent text-accent-foreground border-transparent font-mono text-[10px] uppercase tracking-tighter rounded-none px-2 py-1">
                Premium
              </Badge>
            )}
          </div>

          {/* Actions */}
          <TooltipProvider delayDuration={300}>
          <div className="absolute top-3 right-3 flex flex-col gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
                  aria-pressed={wished}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!user) {
                      toast.error("Sign in to save properties");
                      navigate({ to: "/auth/login" });
                      return;
                    }
                    void toggleWish(p.id);
                  }}
                  className={cn(
                    "size-8 grid place-items-center transition-colors border border-border",
                    wished
                      ? "bg-accent text-accent-foreground"
                      : "bg-background/50 hover:bg-background text-foreground",
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
                  onClick={(e) => {
                    e.preventDefault();
                    toggleComp(p.id);
                  }}
                  className={cn(
                    "size-8 grid place-items-center transition-colors border border-border opacity-0 group-hover:opacity-100 focus:opacity-100",
                    compared
                      ? "bg-accent text-accent-foreground"
                      : "bg-background/50 hover:bg-background text-foreground",
                  )}
                >
                  <GitCompare className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{compared ? "Remove from compare" : "Add to compare"}</TooltipContent>
            </Tooltip>
          </div>
          </TooltipProvider>
        </div>

        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[11px] text-muted-foreground mb-1 uppercase tracking-wider truncate">
              {p.city} • {p.categoryLabel}
            </p>
            <h3 className="text-base font-medium leading-tight group-hover:text-accent transition-colors truncate">
              {p.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1.5">
              {p.beds} Bed • {p.baths} Bath • {p.sqft.toLocaleString()} sqft
            </p>
          </div>
          <div className="text-right font-mono shrink-0">
            <div className="text-base font-bold">{formatCurrency(p.price)}</div>
            <div className="text-[10px] text-muted-foreground tracking-tight">
              {p.priceUnit}
            </div>
            <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Star className="size-3 fill-foreground text-foreground" />
              {p.rating}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

export const PropertyCard = memo(PropertyCardComponent);

function ImageWithSkeleton({ src, alt }: { src?: string | null; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  if (!src) {
    return <div className="absolute inset-0 grid place-items-center bg-surface-hi text-mono-eyebrow">No image</div>;
  }
  return (
    <>
      {!loaded && <Skeleton className="absolute inset-0 w-full h-full rounded-none" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        width={800}
        height={1066}
        onLoad={() => setLoaded(true)}
        className={cn(
          "w-full h-full object-cover transition-transform duration-700 ease-[var(--ease-expo)] group-hover:scale-[1.04]",
          !loaded && "opacity-0",
        )}
      />
    </>
  );
}
