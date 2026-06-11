import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  GitCompare,
  GraduationCap,
  KeyRound,
  MapPin,
  Search as SearchIcon,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import heroBg from "@/assets/hero-bg.jpg";
import { PropertyCard } from "@/components/property/PropertyCard";
import { propertiesApi, type PropertyFacets } from "@/lib/api/properties";
import { COLLEGES, STUDENT_AREAS } from "@/lib/college-discovery";
import { formatCurrency } from "@/lib/currency";
import { CATEGORIES, type Property } from "@/lib/properties";
import { cn } from "@/lib/utils";
import { useAuth } from "@/stores/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Roomzly - Student rooms and PGs near colleges in Dehradun" },
      {
        name: "description",
        content:
          "Find verified rooms, PGs, flats, and student rentals near UPES, Graphic Era, DIT, JBIT, BFIT, DBS, and Tula's Institute on Roomzly.",
      },
      { property: "og:title", content: "Roomzly - Student rooms and PGs near colleges in Dehradun" },
      {
        property: "og:description",
        content:
          "Browse by college, compare trust signals, and contact owners faster on Roomzly's student-first rental marketplace.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const facetsQuery = useQuery({ queryKey: ["properties", "facets"], queryFn: propertiesApi.facets });
  const campusQuery = useQuery({
    queryKey: ["properties", "home", "campus"],
    queryFn: () => propertiesApi.list({ verified: true, studentFriendly: true, sort: "featured", limit: 3 }),
  });
  const verifiedQuery = useQuery({
    queryKey: ["properties", "home", "verified"],
    queryFn: () => propertiesApi.list({ verified: true, ownerVerified: true, sort: "popular", limit: 3 }),
  });

  const facets = facetsQuery.data;
  const campusItems = campusQuery.data?.data ?? [];
  const verifiedItems = verifiedQuery.data?.data ?? [];

  return (
    <div className="animate-fade-in">
      <Hero facets={facets} />
      <BrowseByCollege />
      {campusQuery.isLoading || campusQuery.isError || campusItems.length > 0 ? (
        <PropertySection
          label="Popular near campus"
          title="Student-ready listings"
          body="Shortlist verified rooms, PGs, and shared rentals that already show campus distance, trust cues, and student fit."
          items={campusItems}
          isLoading={campusQuery.isLoading}
          isError={campusQuery.isError}
          retry={() => campusQuery.refetch()}
          exploreSearch={{ verified: 1, studentFriendly: 1 } as never}
        />
      ) : null}
      <StudentAreas />
      {verifiedQuery.isLoading || verifiedQuery.isError || verifiedItems.length > 0 ? (
        <PropertySection
          label="Trust first"
          title="Verified listings you can contact confidently"
          body="These homes surface clearer owner trust, mobile verification, and listing quality so students can decide faster."
          items={verifiedItems}
          isLoading={verifiedQuery.isLoading}
          isError={verifiedQuery.isError}
          retry={() => verifiedQuery.refetch()}
          exploreSearch={{ verified: 1, ownerVerified: 1 } as never}
        />
      ) : null}
      <HowItWorks />
      <Stats facets={facets} />
      <CallToAction />
    </div>
  );
}

function Hero({ facets }: { facets?: PropertyFacets }) {
  const navigate = useNavigate();
  const [collegeSlug, setCollegeSlug] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");

  const onSearch = (event: React.FormEvent) => {
    event.preventDefault();
    navigate({
      to: "/explore",
      search: {
        q: location || undefined,
        collegeSlug: collegeSlug || undefined,
        cat: category || undefined,
        max: budget ? Number(budget) : undefined,
      } as never,
    });
  };

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 z-0">
        <img src={heroBg} alt="" aria-hidden="true" className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />
      </div>

      <div className="relative z-10 px-6 pb-24 pt-20 md:pb-28 md:pt-32">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl animate-fade-up">
            <p className="mb-6 text-mono-eyebrow !text-white/75">
              <span className="mr-2 inline-block size-1.5 animate-pulse rounded-full bg-accent align-middle" />
              Browse verified rentals near {COLLEGES.length} Dehradun colleges
            </p>
            <h1 className="font-display text-5xl font-bold leading-[0.92] tracking-tight text-white sm:text-6xl md:text-7xl">
              Student housing that starts with your campus.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
              Pick your college, compare trust signals, and find rooms, PGs, flats, and shared stays that are actually practical for student life in Dehradun.
            </p>
          </div>

          <form onSubmit={onSearch} className="mt-10 max-w-5xl border border-border bg-surface p-2 text-left">
            <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
              <label className="bg-background p-4">
                <span className="mb-1 block text-[10px] font-mono uppercase text-muted-foreground">College</span>
                <div className="flex items-center gap-2">
                  <GraduationCap className="size-3.5 shrink-0 text-muted-foreground" />
                  <select
                    value={collegeSlug}
                    onChange={(event) => setCollegeSlug(event.target.value)}
                    className="w-full appearance-none bg-transparent text-sm font-medium focus:outline-none"
                  >
                    <option value="">Any campus</option>
                    {COLLEGES.map((college) => (
                      <option key={college.slug} value={college.slug}>
                        {college.shortName}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
              <label className="bg-background p-4">
                <span className="mb-1 block text-[10px] font-mono uppercase text-muted-foreground">Locality</span>
                <div className="flex items-center gap-2">
                  <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                  <input
                    type="text"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Prem Nagar, Clement Town..."
                    className="w-full bg-transparent text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none"
                  />
                </div>
              </label>
              <label className="bg-background p-4">
                <span className="mb-1 block text-[10px] font-mono uppercase text-muted-foreground">Type</span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full appearance-none bg-transparent text-sm font-medium focus:outline-none"
                >
                  <option value="">Any stay</option>
                  {CATEGORIES.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="bg-background p-4">
                <span className="mb-1 block text-[10px] font-mono uppercase text-muted-foreground">Budget</span>
                <select
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  className="w-full appearance-none bg-transparent text-sm font-medium focus:outline-none"
                >
                  <option value="">Any budget</option>
                  <option value="9000">Up to {formatCurrency(9000)}</option>
                  <option value="15000">Up to {formatCurrency(15000)}</option>
                  <option value="25000">Up to {formatCurrency(25000)}</option>
                </select>
              </label>
              <div className="bg-background p-2">
                <button
                  type="submit"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-accent px-6 text-sm font-bold uppercase tracking-widest text-accent-foreground transition-colors hover:bg-accent/90"
                >
                  <SearchIcon className="size-4" />
                  Search
                </button>
              </div>
            </div>
          </form>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <QuickStat label="Verified listings" value={(facets?.verified ?? 0).toLocaleString()} />
            <QuickStat label="Campus filters" value={COLLEGES.length.toString()} />
            <QuickStat label="Student areas" value={STUDENT_AREAS.length.toString()} />
            <QuickStat label="Active listings" value={(facets?.total ?? 0).toLocaleString()} />
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/15 bg-black/20 px-4 py-3 backdrop-blur-sm">
      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/60">{label}</p>
      <p className="mt-2 font-display text-2xl tracking-tight text-white">{value}</p>
    </div>
  );
}

function BrowseByCollege() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-mono-eyebrow mb-3">Browse by college</p>
            <h2 className="font-display text-3xl tracking-tight md:text-4xl">Start with the campus, not just the locality.</h2>
          </div>
          <Link
            to="/explore"
            search={{ studentFriendly: 1, verified: 1 } as never}
            className="inline-flex items-center gap-2 text-sm font-medium hover:text-accent"
          >
            Explore student-friendly listings
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {COLLEGES.map((college) => (
            <Link
              key={college.slug}
              to="/colleges/$collegeSlug"
              params={{ collegeSlug: college.slug }}
              className="group border border-border bg-surface p-5 transition-colors hover:border-foreground/30 hover:bg-surface-hi"
            >
              <div className="mb-6 inline-flex size-10 items-center justify-center border border-border bg-background">
                <GraduationCap className="size-4 text-accent" />
              </div>
              <h3 className="font-display text-2xl tracking-tight">{college.shortName}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{college.name}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {college.areaName}, {college.city}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm text-foreground/80 group-hover:text-accent">
                See nearby rooms
                <ArrowRight className="size-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function StudentAreas() {
  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-mono-eyebrow mb-2">Student verified areas</p>
            <h2 className="font-display text-2xl tracking-tight md:text-3xl">Popular student pockets around Dehradun.</h2>
          </div>
          <p className="max-w-xl text-sm text-muted-foreground">
            These are the areas students usually check first when they want quick campus access and practical day-to-day living.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {STUDENT_AREAS.map((area) => (
            <Link
              key={area.label}
              to="/explore"
              search={area.search as never}
              className="inline-flex items-center gap-2 border border-border bg-background px-4 py-2 text-sm hover:bg-surface-hi"
            >
              <MapPin className="size-4 text-accent" />
              {area.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function PropertySection({
  label,
  title,
  body,
  items,
  isLoading,
  isError,
  retry,
  exploreSearch,
}: {
  label: string;
  title: string;
  body: string;
  items: Property[];
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
  exploreSearch?: Record<string, unknown>;
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-accent">{label}</span>
          <h2 className="mt-3 font-display text-3xl tracking-tight md:text-4xl">{title}</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{body}</p>
        </div>
        <Link
          to="/explore"
          search={exploreSearch as never}
          className="inline-flex items-center gap-2 text-sm font-medium hover:text-accent"
        >
          View listings
          <ArrowRight className="size-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="border border-border bg-surface p-12 text-center">
          <p className="text-mono-eyebrow">Loading live listings</p>
        </div>
      ) : isError ? (
        <div className="border border-border bg-surface p-12 text-center">
          <p className="text-mono-eyebrow mb-4">Could not load listings</p>
          <button
            onClick={retry}
            className="bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-80"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-3">
          {items.map((property, index) => (
            <PropertyCard key={property.id} property={property} index={index} />
          ))}
        </div>
      )}
    </section>
  );
}

const STEPS = [
  {
    icon: GraduationCap,
    label: "01 / Pick your college",
    title: "Browse by campus first",
    body: "Start with UPES, Graphic Era, DIT, JBIT, BFIT, DBS, or Tula's and skip the friction of translating campus intent into localities.",
  },
  {
    icon: ShieldCheck,
    label: "02 / Compare trust",
    title: "Check trust and fit fast",
    body: "Cards and comparison views now surface listing verification, owner verification, mobile trust, and student fit in the same decision path.",
  },
  {
    icon: KeyRound,
    label: "03 / Contact with confidence",
    title: "Move from shortlist to owner",
    body: "Contact flows stay direct, but the product gives students clearer context before they message, call, or open WhatsApp.",
  },
];

function HowItWorks() {
  return (
    <section className="border-y border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-14 max-w-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-accent">How Roomzly works</span>
          <h2 className="mt-3 font-display text-3xl tracking-tight md:text-5xl">
            A cleaner search path for students and parents.
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-3">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="bg-background p-8 md:p-10"
            >
              <step.icon className="mb-8 size-6 text-accent" />
              <p className="text-mono-eyebrow mb-4">{step.label}</p>
              <h3 className="font-display text-2xl tracking-tight">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats({ facets }: { facets?: PropertyFacets }) {
  const stats = [
    { value: (facets?.total ?? 0).toLocaleString(), label: "Active listings" },
    { value: (facets?.verified ?? 0).toLocaleString(), label: "Verified listings" },
    { value: COLLEGES.length.toString(), label: "Supported colleges" },
    { value: STUDENT_AREAS.length.toString(), label: "Student areas" },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.08 }}
          >
            <p className="font-display text-5xl font-bold tracking-tight md:text-6xl">{stat.value}</p>
            <p className="mt-2 text-mono-eyebrow">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function CallToAction() {
  const user = useAuth((state) => state.user);
  const canManageListings = user?.role === "OWNER" || user?.role === "ADMIN";

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <div className="border border-border bg-surface p-10 md:p-16">
        <Sparkles className="mb-6 size-5 text-accent" />
        <h2 className="max-w-2xl font-display text-3xl tracking-tight md:text-5xl">
          Need to fill a room before the next semester starts?
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Roomzly now helps students discover listings by campus, so owners and managers can reach more relevant demand without extra listing clutter.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {canManageListings ? (
            <Link
              to="/dashboard/add-property"
              className="inline-flex items-center gap-2 bg-foreground px-5 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-80"
            >
              Add your listing
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <Link
              to={user ? "/dashboard" : "/auth/signup"}
              className="inline-flex items-center gap-2 bg-foreground px-5 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-80"
            >
              {user ? "Open dashboard" : "Create owner account"}
              <ArrowRight className="size-4" />
            </Link>
          )}
          <Link
            to="/explore"
            search={{ studentFriendly: 1, verified: 1 } as never}
            className="inline-flex items-center gap-2 border border-border px-5 py-3 text-sm font-medium hover:bg-surface-hi"
          >
            Browse student stays
            <GitCompare className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
