import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Heart,
  Share2,
  Star,
  MapPin,
  Sparkles,
  GitCompare,
  Edit,
  ArrowRight,
  Flag,
  Phone,
  MessageCircle,
  Copy,
  Send,
  Navigation,
  GraduationCap,
  Wifi,
  Car,
  Dumbbell,
  Utensils,
  Snowflake,
  WashingMachine,
  Tv,
  Waves,
  ShieldCheck,
  Zap,
  Building2,
  KeyRound,
  LockKeyhole,
  type LucideIcon,
} from "lucide-react";
import { Suspense, lazy, useState } from "react";
import { toast } from "sonner";

import { PropertyCard } from "@/components/property/PropertyCard";
import { ListingDetailSkeleton } from "@/components/property/ListingDetailSkeleton";
import { ProgressiveImage } from "@/components/property/ProgressiveImage";
import { RoomzlyErrorState } from "@/components/ui/premium-states";
import { propertiesApi } from "@/lib/api/properties";
import { bookingsApi } from "@/lib/api/bookings";
import { messagesApi } from "@/lib/api/messages";
import { reportsApi, type ReportType } from "@/lib/api/reports";
const PropertyLocationMap = lazy(() => import("@/components/location/LeafletMap").then((module) => ({ default: module.PropertyLocationMap })));
import { ApiError } from "@/lib/api/client";
import { useWishlist } from "@/stores/wishlist";
import { useCompare } from "@/stores/compare";
import { useAuth } from "@/stores/auth";
import { usePremiumLoading } from "@/stores/loading";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ActionButtonContent, RoomzlyActionMark } from "@/components/ui/action-feedback";
import { formatCurrency } from "@/lib/currency";

export const Route = createFileRoute("/listing/$slug")({
  head: () => ({
    meta: [
      { title: "Listing - Roomzly" },
      { name: "description", content: "Roomzly listing details." },
    ],
  }),
  component: ListingPage,
});

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDescription(description: string) {
  const clean = description.trim();
  if (!clean) return [];

  const explicitParagraphs = clean
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (explicitParagraphs.length > 1 || clean.length < 320) return explicitParagraphs;

  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()) ?? [clean];
  const paragraphs: string[] = [];
  for (let index = 0; index < sentences.length; index += 2) {
    paragraphs.push(sentences.slice(index, index + 2).join(" "));
  }
  return paragraphs;
}

function amenityIconFor(amenity: string): LucideIcon {
  const value = amenity.toLowerCase();
  if (value.includes("wifi") || value.includes("internet")) return Wifi;
  if (value.includes("parking") || value.includes("garage")) return Car;
  if (value.includes("gym") || value.includes("fitness")) return Dumbbell;
  if (value.includes("kitchen") || value.includes("food") || value.includes("mess")) return Utensils;
  if (value.includes("ac") || value.includes("air") || value.includes("cool")) return Snowflake;
  if (value.includes("laundry") || value.includes("washing")) return WashingMachine;
  if (value.includes("tv") || value.includes("television")) return Tv;
  if (value.includes("pool") || value.includes("water")) return Waves;
  if (value.includes("security") || value.includes("cctv") || value.includes("guard")) return ShieldCheck;
  if (value.includes("power") || value.includes("backup") || value.includes("electric")) return Zap;
  if (value.includes("lift") || value.includes("elevator")) return Building2;
  if (value.includes("key") || value.includes("access")) return KeyRound;
  if (value.includes("lock") || value.includes("safe")) return LockKeyhole;
  return Sparkles;
}

function WhatsAppMark() {
  return (
    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#25D366] text-white">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-4"
        fill="currentColor"
      >
        <path d="M12.04 2C6.57 2 2.12 6.43 2.12 11.88c0 1.74.46 3.44 1.33 4.93L2 22l5.34-1.4a9.92 9.92 0 0 0 4.7 1.19h.01c5.47 0 9.92-4.43 9.92-9.88C21.97 6.45 17.52 2 12.04 2Zm0 18.1h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.17.83.85-3.08-.2-.32a8.13 8.13 0 0 1-1.25-4.32c0-4.52 3.7-8.2 8.27-8.2 2.2 0 4.28.86 5.84 2.41a8.14 8.14 0 0 1 2.43 5.82c0 4.52-3.7 8.19-8.27 8.19Zm4.54-6.14c-.25-.12-1.47-.72-1.7-.8-.23-.09-.39-.13-.56.12-.17.25-.64.8-.79.97-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2.01-1.23-.74-.66-1.24-1.48-1.39-1.73-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.08 0 1.22.9 2.41 1.02 2.58.12.17 1.77 2.68 4.28 3.76.6.26 1.06.41 1.43.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.1-.23-.16-.48-.28Z" />
      </svg>
    </span>
  );
}

function ListingPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuth((state) => state.user);
  const showPremiumLoading = usePremiumLoading((s) => s.show);
  const hidePremiumLoading = usePremiumLoading((s) => s.hideAfterMinimum);
  const propertyQuery = useQuery({
    queryKey: ["property", slug],
    queryFn: () => propertiesApi.detail(slug),
  });
  const p = propertyQuery.data;
  const wished = useWishlist((s) => (p ? s.ids.includes(p.id) : false));
  const toggleWish = useWishlist((s) => s.toggle);
  const compared = useCompare((s) => (p ? s.ids.includes(p.id) : false));
  const toggleComp = useCompare((s) => s.toggle);
  const [moveInDate, setMoveInDate] = useState<Date | undefined>();
  const [reviewBody, setReviewBody] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("FAKE_LISTING");
  const [reportDescription, setReportDescription] = useState("");

  const reviewsQuery = useQuery({
    queryKey: ["property", slug, "reviews"],
    queryFn: () => propertiesApi.reviews(slug),
    enabled: Boolean(p),
  });
  const similarQuery = useQuery({
    queryKey: ["properties", "similar", p?.category, p?.id],
    queryFn: () => propertiesApi.list({ cat: p!.category, limit: 3 }),
    enabled: Boolean(p),
  });
  const similar = (similarQuery.data?.data ?? []).filter((item) => item.id !== p?.id).slice(0, 3);

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!p) throw new Error("Property not loaded");
      if (!moveInDate) throw new Error("Choose a move-in date first");
      const checkIn = moveInDate;
      const checkOut = addDays(moveInDate, 30);
      return bookingsApi.create({
        propertyId: p.id,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        moveInDate: checkIn.toISOString(),
      });
    },
    onMutate: () => {
      showPremiumLoading("Sending your booking request...");
    },
    onSuccess: () => {
      toast.success("Booking request sent");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      hidePremiumLoading();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError || error instanceof Error ? error.message : "Could not request booking");
      hidePremiumLoading();
    },
  });

  const threadMutation = useMutation({
    mutationFn: async () => {
      if (!p) throw new Error("Property not loaded");
      return messagesApi.createThread({ propertyId: p.id });
    },
    onMutate: () => {
      showPremiumLoading("Opening private Roomzly chat...");
    },
    onSuccess: (thread) => {
      toast.success("Private chat opened");
      queryClient.invalidateQueries({ queryKey: ["message-threads"] });
      navigate({ to: "/dashboard/messages", search: { threadId: thread.id } });
      hidePremiumLoading();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError || error instanceof Error ? error.message : "Could not open chat");
      hidePremiumLoading();
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!p) throw new Error("Property not loaded");
      return propertiesApi.createReview(p.id, { rating: reviewRating, body: reviewBody.trim() });
    },
    onSuccess: () => {
      setReviewBody("");
      setReviewRating(5);
      queryClient.invalidateQueries({ queryKey: ["property", slug, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["property", slug] });
      toast.success("Review saved");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError || error instanceof Error ? error.message : "Could not save review");
    },
  });
  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!p) throw new Error("Property not loaded");
      return reportsApi.create({
        targetType: "PROPERTY",
        targetId: p.id,
        type: reportType,
        description: reportDescription.trim(),
      });
    },
    onSuccess: () => {
      setReportOpen(false);
      setReportType("FAKE_LISTING");
      setReportDescription("");
      toast.success("Report submitted");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError || error instanceof Error ? error.message : "Could not submit report");
    },
  });

  const ensureSignedIn = () => {
    if (user) return true;
    toast.error("Sign in to continue");
    navigate({ to: "/auth/login" });
    return false;
  };

  if (propertyQuery.isLoading) {
    return <ListingDetailSkeleton />;
  }

  if (propertyQuery.isError || !p) {
    return (
      <div className="min-h-dvh px-6 py-16">
        <RoomzlyErrorState
          className="mx-auto max-w-2xl"
          eyebrow="Listing unavailable"
          title="This listing could not be loaded"
          description="The property may have moved, expired, or the network may be slow. Try again or continue exploring verified spaces."
          actionLabel="Try again"
          onAction={() => propertyQuery.refetch()}
        />
        <div className="mt-5 text-center">
          <Link to="/explore" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to explore
          </Link>
        </div>
      </div>
    );
  }

  const gallery = p.gallery.length > 0 ? p.gallery : p.image ? [p.image] : [];
  const reviews = reviewsQuery.data ?? [];
  const canEditProperty = user?.id === p.owner.id;
  const selectedLightboxImage = lightboxIndex !== null ? gallery[lightboxIndex] : undefined;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const showPreviousImage = () => {
    setLightboxIndex((index) => {
      if (index === null) return index;
      return index === 0 ? gallery.length - 1 : index - 1;
    });
  };

  const showNextImage = () => {
    setLightboxIndex((index) => {
      if (index === null) return index;
      return index === gallery.length - 1 ? 0 : index + 1;
    });
  };

  const phone = (p.owner.phoneNumber ?? p.owner.phone)?.trim();
  const callablePhone = phone?.replace(/[^\d+]/g, "");
  const shareUrl = typeof window === "undefined" ? `https://roomzly.in/listing/${p.slug}` : window.location.href;
  const shareText = `Take a look at ${p.title} on Roomzly`;
  const whatsappContactUrl = callablePhone
    ? `https://wa.me/${callablePhone.replace(/^\+/, "")}?text=${encodeURIComponent(`Hi, I found your property "${p.title}" on Roomzly. Is it available?`)}`
    : undefined;
  const descriptionBlocks = formatDescription(p.description);
  const startPrivateChat = () => {
    if (ensureSignedIn()) threadMutation.mutate();
  };
  const requestBooking = () => {
    if (!moveInDate) {
      toast.error("Choose a move-in date first");
      return;
    }
    if (ensureSignedIn()) bookingMutation.mutate();
  };
  const mapsUrl =
    p.latitude != null && p.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.formattedAddress ?? p.address ?? `${p.title} ${p.city}`)}`;
  const directionsUrl =
    p.latitude != null && p.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`
      : mapsUrl;
  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Property link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleShare = () => {
    setShareOpen(true);
  };

  return (
    <div className="animate-fade-in pb-24 lg:pb-0">
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between gap-2">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">All listings</span>
          </Link>
          <div className="flex items-center gap-1.5">
            {canEditProperty && (
              <Link
                to="/dashboard/edit-property/$id"
                params={{ id: p.id }}
                className="h-8 px-3 border border-border rounded-sm inline-flex items-center gap-1.5 text-xs font-mono uppercase hover:bg-surface-hi transition-colors"
              >
                <Edit className="size-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </Link>
            )}
            <button
              onClick={() => toggleComp(p.id)}
              aria-pressed={compared}
              className={cn(
                "h-8 px-3 border border-border rounded-sm inline-flex items-center gap-1.5 text-xs font-mono uppercase hover:bg-surface-hi transition-colors",
                compared && "bg-accent text-accent-foreground border-accent",
              )}
            >
              <GitCompare className="size-3.5" />
              <span className="hidden sm:inline">Compare</span>
            </button>
            <button
              onClick={handleShare}
              aria-label="Share"
              className="size-8 grid place-items-center border border-border rounded-sm hover:bg-surface-hi transition-colors"
            >
              <Share2 className="size-3.5" />
            </button>
            <button
              onClick={() => {
                if (ensureSignedIn()) setReportOpen(true);
              }}
              aria-label="Report listing"
              className="size-8 grid place-items-center border border-border rounded-sm hover:bg-surface-hi transition-colors"
            >
              <Flag className="size-3.5" />
            </button>
            <button
              onClick={() => {
                if (ensureSignedIn()) void toggleWish(p.id);
              }}
              aria-pressed={wished}
              aria-label="Save"
              className={cn(
                "size-8 grid place-items-center border border-border rounded-sm hover:bg-surface-hi transition-colors",
                wished && "bg-accent text-accent-foreground border-accent",
              )}
            >
              <Heart className={cn("size-3.5", wished && "fill-current")} />
            </button>
          </div>
        </div>
      </div>

      <header className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">
        <p className="text-mono-eyebrow mb-3">{p.code} / {p.categoryLabel}</p>
        <h1 className="font-display text-3xl sm:text-5xl md:text-6xl tracking-tighter leading-none font-bold mb-5">
          {p.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" /> {[p.neighborhood, p.city].filter(Boolean).join(", ")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Star className="size-3.5 fill-foreground text-foreground shrink-0" />
            {p.rating} / {p.reviews} reviews
          </span>
          {p.verified && (
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="size-3.5 text-accent shrink-0" /> Verified listing
            </span>
          )}
          {p.owner.verified && (
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="size-3.5 text-accent shrink-0" /> Verified owner
            </span>
          )}
          {p.owner.phoneVerified && (
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="size-3.5 text-accent shrink-0" /> Mobile Verified
            </span>
          )}
          {p.primaryCollege && (
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="size-3.5 text-accent shrink-0" />
              {p.primaryCollege.distanceKm < 1
                ? `${Math.round(p.primaryCollege.distanceKm * 1000)} m (${p.primaryCollege.distanceKm} km)`
                : `${p.primaryCollege.distanceKm} km`}{" "}
              from {p.primaryCollege.name || p.primaryCollege.shortName}
            </span>
          )}
        </div>
        <div className="mt-6 grid gap-2 rounded-sm border border-border bg-surface p-2 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
          <div className="px-2 py-1 space-y-1">
            <p className="text-sm font-semibold">Interested in this property?</p>
            <p className="text-xs text-muted-foreground">Talk to the owner directly or use Roomzly chat for privacy.</p>
            {p.primaryCollege && (
              <p className="text-xs text-muted-foreground">
                {p.primaryCollege.shortName} is {p.primaryCollege.walkingMinutes} min away on foot or about {p.primaryCollege.drivingMinutes} min by road.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={startPrivateChat}
            disabled={threadMutation.isPending}
            className="min-h-11 rounded-sm bg-foreground px-4 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            <ActionButtonContent
              pending={threadMutation.isPending}
              idleLabel="Chat on Roomzly"
              pendingLabel="Opening private chat"
              icon={<MessageCircle className="size-4" />}
            />
          </button>
          {whatsappContactUrl && (
            <a
              href={whatsappContactUrl}
              target="_blank"
              rel="noreferrer"
              className="min-h-11 rounded-sm border border-border bg-background px-4 text-sm font-semibold transition-colors hover:bg-surface-hi inline-flex items-center justify-center gap-2"
            >
              <WhatsAppMark />
              WhatsApp
            </a>
          )}
          {callablePhone && (
            <a
              href={`tel:${callablePhone}`}
              className="min-h-11 rounded-sm border border-border bg-background px-4 text-sm font-semibold transition-colors hover:bg-surface-hi inline-flex items-center justify-center gap-2"
            >
              <Phone className="size-4" />
              Call
            </a>
          )}
        </div>
      </header>

      {gallery.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-10">
          <div className="md:hidden relative">
            <div
              className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth border border-border bg-black"
              aria-label={`${p.title} image gallery`}
              onScroll={(event) => {
                const target = event.currentTarget;
                const nextIndex = Math.round(target.scrollLeft / target.clientWidth);
                setActiveGalleryIndex(Math.min(Math.max(nextIndex, 0), gallery.length - 1));
              }}
            >
              {gallery.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => openLightbox(index)}
                  className="relative min-w-full aspect-[4/3] snap-center bg-black"
                  aria-label={`Open image ${index + 1} of ${gallery.length}`}
                >
                  <ProgressiveImage
                    src={image}
                    alt={`${p.title} image ${index + 1} of ${gallery.length}`}
                    loading={index === 0 ? "eager" : "lazy"}
                    wrapperClassName="size-full"
                    className="object-contain"
                  />
                </button>
              ))}
            </div>
            <div className="absolute right-3 top-3 bg-black/70 text-white px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest">
              {activeGalleryIndex + 1}/{gallery.length}
            </div>
            {gallery.length > 1 && (
              <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
                {gallery.map((image, index) => (
                  <span
                    key={`${image}-dot-${index}`}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      index === activeGalleryIndex ? "w-5 bg-accent" : "w-1.5 bg-muted-foreground/30",
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="hidden md:grid lg:hidden grid-cols-2 gap-2">
            {gallery.map((image, index) => (
              <button
                key={`${image}-tablet-${index}`}
                type="button"
                onClick={() => openLightbox(index)}
                className={cn(
                  "relative aspect-[4/3] overflow-hidden border border-border bg-black",
                  gallery.length === 1 && "col-span-2",
                )}
                aria-label={`Open image ${index + 1} of ${gallery.length}`}
              >
                <ProgressiveImage
                  src={image}
                  alt={`${p.title} image ${index + 1} of ${gallery.length}`}
                  loading={index < 2 ? "eager" : "lazy"}
                  wrapperClassName="size-full"
                  className="object-contain"
                />
                <span className="absolute right-3 top-3 bg-black/70 text-white px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest">
                  {index + 1}/{gallery.length}
                </span>
              </button>
            ))}
          </div>

          <div className="hidden lg:grid grid-cols-4 grid-rows-2 gap-2" style={{ height: "480px" }}>
            <button
              type="button"
              onClick={() => openLightbox(0)}
              className="relative col-span-2 row-span-2 border border-border overflow-hidden"
              aria-label={`Open image 1 of ${gallery.length}`}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="size-full"
              >
                <ProgressiveImage
                  src={gallery[0]}
                  alt={p.title}
                  loading="eager"
                  wrapperClassName="size-full"
                  className="object-cover"
                />
              </motion.div>
              <span className="absolute right-3 top-3 bg-black/70 text-white px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest">
                1/{gallery.length}
              </span>
            </button>
            {gallery.slice(1, 5).map((g, index) => (
              <button
                key={g}
                type="button"
                onClick={() => openLightbox(index + 1)}
                className="relative border border-border overflow-hidden"
                aria-label={`Open image ${index + 2} of ${gallery.length}`}
              >
                <ProgressiveImage
                  src={g}
                  alt={`${p.title} image ${index + 2} of ${gallery.length}`}
                  loading="lazy"
                  wrapperClassName="size-full"
                  className="object-cover"
                />
                {index === 3 && gallery.length > 5 && (
                  <span className="absolute inset-0 bg-black/55 text-white grid place-items-center text-sm font-mono uppercase tracking-widest">
                    +{gallery.length - 5} more
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => !open && setLightboxIndex(null)}>
        <DialogContent className="max-w-[100vw] w-[100vw] h-[100dvh] border-0 bg-black p-0 text-white sm:rounded-none">
          <DialogTitle className="sr-only">{p.title} gallery</DialogTitle>
          <DialogDescription className="sr-only">
            Expanded property gallery image viewer
          </DialogDescription>
          {selectedLightboxImage && lightboxIndex !== null && (
            <div className="relative size-full grid place-items-center px-4 py-14 sm:px-8">
              <img
                src={selectedLightboxImage}
                alt={`${p.title} expanded image ${lightboxIndex + 1} of ${gallery.length}`}
                className="max-h-full max-w-full object-contain"
              />
              <div className="absolute left-4 top-4 bg-white/10 text-white px-3 py-1.5 text-xs font-mono uppercase tracking-widest">
                {lightboxIndex + 1}/{gallery.length}
              </div>
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPreviousImage}
                    className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 size-10 sm:size-11 border border-white/20 bg-black/40 grid place-items-center hover:bg-white/10"
                    aria-label="Previous image"
                  >
                    <ArrowLeft className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={showNextImage}
                    className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 size-10 sm:size-11 border border-white/20 bg-black/40 grid place-items-center hover:bg-white/10"
                    aria-label="Next image"
                  >
                    <ArrowRight className="size-5" />
                  </button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Report listing</DialogTitle>
          <DialogDescription>
            Reports help Roomzly investigate unsafe, fake, or misleading listings.
          </DialogDescription>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (reportDescription.trim().length < 10) {
                toast.error("Add at least 10 characters of detail");
                return;
              }
              reportMutation.mutate();
            }}
          >
            <label className="block">
              <span className="text-mono-eyebrow block mb-2">Reason</span>
              <select
                value={reportType}
                onChange={(event) => setReportType(event.target.value as ReportType)}
                className="w-full bg-background border border-border px-3 py-2.5 text-sm rounded-sm focus:outline-none focus:border-accent"
              >
                <option value="FAKE_LISTING">Fake listing</option>
                <option value="SCAM">Scam</option>
                <option value="HARASSMENT">Harassment</option>
                <option value="SPAM">Spam</option>
                <option value="FAKE_BROKER">Fake broker</option>
              </select>
            </label>
            <label className="block">
              <span className="text-mono-eyebrow block mb-2">Details</span>
              <textarea
                value={reportDescription}
                onChange={(event) => setReportDescription(event.target.value)}
                rows={4}
                className="w-full bg-background border border-border px-3 py-2.5 text-sm rounded-sm focus:outline-none focus:border-accent"
                placeholder="Describe what looks wrong or unsafe"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="px-4 py-2.5 border border-border rounded-sm font-mono text-[10px] uppercase tracking-widest hover:bg-surface-hi"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reportMutation.isPending}
                className="bg-foreground text-background px-4 py-2.5 rounded-sm font-mono text-[10px] uppercase tracking-widest font-bold disabled:opacity-50"
              >
                <ActionButtonContent
                  pending={reportMutation.isPending}
                  idleLabel="Submit report"
                  pendingLabel="Submitting"
                />
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Share property</DialogTitle>
          <DialogDescription>
            Send this listing to family, roommates, or anyone helping with the search.
          </DialogDescription>
          <div className="grid gap-2">
            <button
              type="button"
              onClick={copyShareLink}
              className="w-full border border-border px-4 py-3 rounded-sm text-sm font-semibold hover:bg-surface-hi transition-colors inline-flex items-center justify-center gap-2"
            >
              <Copy className="size-4" />
              Copy link
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full border border-border px-4 py-3 rounded-sm text-sm font-semibold hover:bg-surface-hi transition-colors inline-flex items-center justify-center gap-2"
            >
              <WhatsAppMark />
              WhatsApp
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full border border-border px-4 py-3 rounded-sm text-sm font-semibold hover:bg-surface-hi transition-colors inline-flex items-center justify-center gap-2"
            >
              <Share2 className="size-4" />
              Facebook
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full border border-border px-4 py-3 rounded-sm text-sm font-semibold hover:bg-surface-hi transition-colors inline-flex items-center justify-center gap-2"
            >
              <Send className="size-4" />
              X
            </a>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] gap-10 lg:gap-14 items-start">
          <div className="space-y-12 min-w-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-border">
              {[
                ["Beds", p.beds],
                ["Baths", p.baths],
                ["Sqft", p.sqft.toLocaleString()],
                ["Furnishing", p.furnishing],
              ].map(([k, v]) => (
                <div key={String(k)} className="bg-background p-4 sm:p-5">
                  <p className="text-mono-eyebrow mb-2">{k}</p>
                  <p className="font-display text-xl sm:text-2xl">{v}</p>
                </div>
              ))}
            </div>

            <section className="border border-border bg-surface p-5 sm:p-6">
              <p className="text-mono-eyebrow mb-3">About this property</p>
              <div className="space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
                {descriptionBlocks.map((paragraph, index) => (
                  <p key={`${paragraph}-${index}`}>{paragraph}</p>
                ))}
              </div>
            </section>

            <Tabs defaultValue="amenities">
              <TabsList className="w-full bg-surface border border-border h-auto p-0 rounded-none flex overflow-x-auto">
                {["amenities", "location", "reviews"].map((t) => (
                  <TabsTrigger
                    key={t}
                    value={t}
                    className="flex-1 min-w-[80px] rounded-none px-4 py-3 font-mono text-[10px] uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    {t}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="amenities" className="mt-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {p.amenities.map((a) => {
                    const AmenityIcon = amenityIconFor(a);
                    return (
                      <div key={a} className="min-h-16 border border-border bg-surface px-4 py-3 text-sm flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-background text-accent">
                          <AmenityIcon className="size-4" />
                        </span>
                        <span className="font-medium">{a}</span>
                      </div>
                    );
                  })}
                  {p.amenities.length === 0 && (
                    <p className="text-sm text-muted-foreground">No amenities have been added.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="location" className="mt-6">
                <div className="space-y-4">
                  <div className="border border-border bg-surface p-6">
                    <p className="text-mono-eyebrow mb-3">Address</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {p.formattedAddress ?? p.address ?? [p.locality ?? p.neighborhood, p.city, p.state, p.country].filter(Boolean).join(", ")}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="border border-border px-4 py-2.5 text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-surface-hi inline-flex items-center gap-2"
                      >
                        <MapPin className="size-3.5" />
                        Open in Google Maps
                      </a>
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-foreground text-background px-4 py-2.5 text-xs font-bold uppercase tracking-widest rounded-sm inline-flex items-center gap-2"
                      >
                        <Navigation className="size-3.5" />
                        Get directions
                      </a>
                      {p.primaryCollege?.latitude != null && p.primaryCollege?.longitude != null && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&origin=${p.latitude},${p.longitude}&destination=${p.primaryCollege.latitude},${p.primaryCollege.longitude}&travelmode=walking`}
                          target="_blank"
                          rel="noreferrer"
                          className="border border-border bg-surface hover:bg-surface-hi px-4 py-2.5 text-xs font-bold uppercase tracking-widest rounded-sm inline-flex items-center gap-2 transition-colors"
                        >
                          <GraduationCap className="size-3.5 text-accent" />
                          Walk to {p.primaryCollege.shortName} ({p.primaryCollege.distanceKm < 1 ? `${Math.round(p.primaryCollege.distanceKm * 1000)} m` : `${p.primaryCollege.distanceKm} km`})
                        </a>
                      )}
                    </div>
                  </div>
                  <Suspense
                    fallback={
                      <div className="border border-border bg-surface p-6 min-h-[24rem] grid place-items-center text-sm text-muted-foreground">
                        Loading map preview
                      </div>
                    }
                  >
                    <PropertyLocationMap latitude={p.latitude} longitude={p.longitude} title={p.title} primaryCollege={p.primaryCollege} />
                  </Suspense>
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <div className="border border-border divide-y divide-border">
                  {reviewsQuery.isLoading && <p className="p-5 text-sm text-muted-foreground">Loading reviews</p>}
                  {!reviewsQuery.isLoading && reviews.length === 0 && (
                    <p className="p-5 text-sm text-muted-foreground">No reviews yet.</p>
                  )}
                  {reviews.map((review) => (
                    <div key={review.id} className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="size-9 shrink-0">
                          <AvatarFallback className="bg-surface-hi text-xs font-mono">
                            {review.user.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{review.user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {review.rating}/5 / {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{review.body}</p>
                    </div>
                  ))}
                </div>
                {user && user.id !== p.owner.id && (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (!reviewBody.trim()) return;
                      reviewMutation.mutate();
                    }}
                    className="mt-4 border border-border bg-surface p-4 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <label className="text-mono-eyebrow">Rating</label>
                      <select
                        value={reviewRating}
                        onChange={(event) => setReviewRating(Number(event.target.value))}
                        className="bg-background border border-border px-3 py-2 text-sm rounded-sm"
                      >
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <option key={rating} value={rating}>{rating}</option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      value={reviewBody}
                      onChange={(event) => setReviewBody(event.target.value)}
                      rows={3}
                      className="w-full bg-background border border-border px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-accent"
                      placeholder="Share your experience after a confirmed stay"
                    />
                    <button
                      type="submit"
                      disabled={reviewMutation.isPending}
                      className="bg-foreground text-background px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-sm disabled:opacity-50"
                    >
                      <ActionButtonContent
                        pending={reviewMutation.isPending}
                        idleLabel="Submit review"
                        pendingLabel="Saving"
                      />
                    </button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <aside className="lg:sticky lg:top-20">
            <div className="border border-border bg-surface">
              <div className="p-5 sm:p-6 border-b border-border flex items-end justify-between">
                <div>
                  <p className="font-display text-3xl font-bold">{formatCurrency(p.price)}</p>
                  <p className="text-mono-eyebrow mt-1">{p.priceUnit}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm inline-flex items-center gap-1">
                    <Star className="size-3.5 fill-foreground text-foreground" /> {p.rating}
                  </p>
                  <p className="text-xs text-muted-foreground">{p.reviews} reviews</p>
                </div>
              </div>

              <div className="p-5 sm:p-6 border-b border-border space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-mono-eyebrow">Booking request</p>
                    <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">Choose your move-in date</h2>
                  </div>
                  <div className="shrink-0 border border-border bg-background px-3 py-2 text-right">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Move in</p>
                    <p className="mt-0.5 max-w-[120px] truncate text-xs font-semibold">
                      {moveInDate
                        ? moveInDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                        : "Choose date"}
                    </p>
                  </div>
                </div>
                <div className="flex justify-center overflow-hidden border border-border bg-background p-1">
                  <Calendar
                    mode="single"
                    selected={moveInDate}
                    onSelect={setMoveInDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={requestBooking}
                  disabled={bookingMutation.isPending}
                  className="w-full min-h-12 bg-accent text-accent-foreground px-5 py-3 text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  <ActionButtonContent
                    pending={bookingMutation.isPending}
                    idleLabel="Book Now"
                    pendingLabel="Sending request"
                  />
                </button>
                <p className="text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  No charge until booking is confirmed
                </p>
              </div>

              <div className="p-5 sm:p-6 border-b border-border space-y-5">
                <div className="flex items-center gap-3">
                  <Avatar className="size-11 shrink-0">
                    <AvatarFallback className="bg-foreground text-background text-xs font-mono font-bold">
                      {p.owner.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-semibold">{p.owner.name}</p>
                      {p.owner.verified && <BadgeCheck className="size-3.5 shrink-0 text-accent" />}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{p.owner.role}</p>
                    {p.primaryCollege && (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <GraduationCap className="size-3 text-accent" />
                        {p.primaryCollege.distanceKm < 1
                          ? `${Math.round(p.primaryCollege.distanceKm * 1000)} m (${p.primaryCollege.distanceKm} km)`
                          : `${p.primaryCollege.distanceKm} km`}{" "}
                        from {p.primaryCollege.shortName}
                      </p>
                    )}
                    {p.owner.phoneVerified && (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-accent">
                        <BadgeCheck className="size-3" />
                        Mobile Verified
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {callablePhone && (
                    <a
                      href={`tel:${callablePhone}`}
                      className="w-full border border-border bg-background py-3 text-sm font-semibold rounded-sm hover:bg-surface-hi transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <Phone className="size-4" />
                      Call
                    </a>
                  )}
                  {whatsappContactUrl && (
                    <a
                      href={whatsappContactUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full border border-border bg-background py-3 text-sm font-semibold rounded-sm hover:bg-surface-hi transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <WhatsAppMark />
                      WhatsApp
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  onClick={startPrivateChat}
                  disabled={threadMutation.isPending}
                  className="w-full min-h-12 border border-border bg-background py-3 text-sm font-semibold rounded-sm hover:bg-surface-hi transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  <ActionButtonContent
                    pending={threadMutation.isPending}
                    idleLabel="Private Roomzly chat"
                    pendingLabel="Opening private chat"
                    icon={<MessageCircle className="size-4" />}
                  />
                </button>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Use Roomzly chat when you want privacy, saved history, and platform visibility before sharing your number.
                </p>
              </div>

              <div className="grid grid-cols-3 divide-x divide-border text-muted-foreground">
                <button
                  type="button"
                  onClick={handleShare}
                  className="min-h-12 text-xs font-semibold hover:bg-surface-hi hover:text-foreground transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <Share2 className="size-3.5" />
                  Share
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (ensureSignedIn()) void toggleWish(p.id);
                  }}
                  className={cn(
                    "min-h-12 text-xs font-semibold hover:bg-surface-hi hover:text-foreground transition-colors inline-flex items-center justify-center gap-1.5",
                    wished && "text-accent",
                  )}
                  aria-pressed={wished}
                >
                  <Heart className={cn("size-3.5", wished && "fill-current")} />
                  {wished ? "Saved" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (ensureSignedIn()) setReportOpen(true);
                  }}
                  className="min-h-12 text-xs font-semibold hover:bg-surface-hi hover:text-foreground transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <Flag className="size-3.5" />
                  Report
                </button>
              </div>

            </div>
          </aside>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 mt-10 border-t border-border">
          <div className="mb-10">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
              You might also consider
            </span>
            <h2 className="font-display text-2xl sm:text-3xl mt-3 tracking-tight">Similar properties</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12">
            {similar.map((s, i) => (
              <PropertyCard key={s.id} property={s} index={i} />
            ))}
          </div>
        </section>
      )}

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-lg font-bold leading-none">{formatCurrency(p.price)}</p>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">
            {p.priceUnit}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {callablePhone && (
            <a
              href={`tel:${callablePhone}`}
              aria-label="Call owner"
              className="size-10 bg-foreground text-background rounded-sm grid place-items-center"
            >
              <Phone className="size-4" />
            </a>
          )}
          <button
            type="button"
            onClick={startPrivateChat}
            disabled={threadMutation.isPending}
            aria-label="Chat on Roomzly"
            className="size-10 border border-border rounded-sm hover:bg-surface-hi transition-colors disabled:opacity-50 grid place-items-center"
          >
            {threadMutation.isPending ? <RoomzlyActionMark className="size-4" /> : <MessageCircle className="size-4" />}
          </button>
          <button
            onClick={requestBooking}
            disabled={bookingMutation.isPending}
            className="bg-accent text-accent-foreground px-4 py-2.5 text-sm font-bold rounded-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            <ActionButtonContent
              pending={bookingMutation.isPending}
              idleLabel="Book Now"
              pendingLabel="Booking"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
