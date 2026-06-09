import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  MapPin,
  Search as SearchIcon,
  ShieldCheck,
  Sparkles,
  KeyRound,
} from "lucide-react";
import { useState } from "react";

import { PropertyCard } from "@/components/property/PropertyCard";
import { propertiesApi, type PropertyFacets } from "@/lib/api/properties";
import { CATEGORIES, type Property } from "@/lib/properties";
import { useAuth } from "@/stores/auth";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";

import heroBg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Roomzly - Find your next perspective" },
      {
        name: "description",
        content:
          "Premium curated real estate. Rent, buy, or discover verified apartments, villas, PGs and commercial spaces with Roomzly.",
      },
      { property: "og:title", content: "Roomzly - Find your next perspective" },
      {
        property: "og:description",
        content: "Curated, verified, and considered properties for the modern resident.",
      },
    ],
  }),
  component: HomePage,
});

const TABS = ["Rent", "PG", "Commercial"] as const;

function HomePage() {
  const facetsQuery = useQuery({ queryKey: ["properties", "facets"], queryFn: propertiesApi.facets });
  const trendingQuery = useQuery({
    queryKey: ["properties", "home", "trending"],
    queryFn: () => propertiesApi.list({ sort: "popular", limit: 3 }),
  });
  const featuredQuery = useQuery({
    queryKey: ["properties", "home", "featured"],
    queryFn: () => propertiesApi.list({ premium: true, sort: "featured", limit: 3 }),
  });
  const facets = facetsQuery.data;

  return (
    <div className="animate-fade-in">
      <Hero facets={facets} />
      <CategoriesStrip facets={facets} />
      <PropertySection
        label="Curated selection"
        title="Trending Properties"
        items={trendingQuery.data?.data ?? []}
        isLoading={trendingQuery.isLoading}
        isError={trendingQuery.isError}
        retry={() => trendingQuery.refetch()}
      />
      <CitiesBento facets={facets} />
      <PropertySection
        label="Hand-picked"
        title="Premium Residences"
        items={featuredQuery.data?.data ?? []}
        isLoading={featuredQuery.isLoading}
        isError={featuredQuery.isError}
        retry={() => featuredQuery.refetch()}
        exploreSearch={{ premium: 1 } as never}
      />
      <HowItWorks />
      <Stats facets={facets} />
      <CallToAction />
    </div>
  );
}

function Hero({ facets }: { facets?: PropertyFacets }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Rent");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const navigate = useNavigate();
  const verified = facets?.verified ?? 0;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const max = budget ? Number(budget) : undefined;
    navigate({
      to: "/explore",
      search: {
        q: location || undefined,
        cat: category || undefined,
        max,
      } as never,
    });
  };

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 z-0">
        <img src={heroBg} alt="" aria-hidden="true" className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/70" />
      </div>

      <div className="relative z-10 pt-20 pb-24 md:pt-32 md:pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center animate-fade-up">
          <p className="text-mono-eyebrow mb-6 !text-white/70">
            <span className="inline-block size-1.5 rounded-full bg-accent mr-2 align-middle animate-pulse" />
            {verified.toLocaleString()} verified listings
          </p>
          <h1 className="font-display text-5xl sm:text-6xl md:text-8xl tracking-tighter leading-[0.9] font-bold mb-8 text-white">
            FIND YOUR
            <br />
            <span className="text-white/50">NEXT PERSPECTIVE.</span>
          </h1>
          <p className="text-base md:text-lg text-white/60 max-w-xl mx-auto mb-12">
            A curated marketplace for considered living across live Roomzly listings.
          </p>

          <form
            onSubmit={onSearch}
            className="max-w-4xl mx-auto bg-surface border border-border p-2 rounded-sm text-left"
          >
            <div className="flex border-b border-border overflow-x-auto no-scrollbar">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    "px-5 py-3 text-[11px] font-mono uppercase tracking-widest whitespace-nowrap transition-colors border-b-2",
                    tab === t
                      ? "border-accent text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_auto] divide-y md:divide-y-0 md:divide-x divide-border mt-2">
              <label className="p-4 block cursor-text">
                <span className="block text-[10px] uppercase font-mono text-muted-foreground mb-1">
                  Location
                </span>
                <div className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City or neighborhood"
                    className="bg-transparent text-sm font-medium w-full focus:outline-none placeholder:text-muted-foreground/60"
                  />
                </div>
              </label>
              <label className="p-4 block cursor-pointer">
                <span className="block text-[10px] uppercase font-mono text-muted-foreground mb-1">
                  Type
                </span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="bg-transparent text-sm font-medium focus:outline-none w-full appearance-none cursor-pointer"
                >
                  <option className="bg-surface" value="">Any property</option>
                  {CATEGORIES.map((item) => (
                    <option key={item.key} className="bg-surface" value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="p-4 block cursor-pointer">
                <span className="block text-[10px] uppercase font-mono text-muted-foreground mb-1">
                  Budget
                </span>
                <select
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  className="bg-transparent text-sm font-medium focus:outline-none w-full appearance-none cursor-pointer"
                >
                  <option className="bg-surface" value="">Any</option>
                  <option className="bg-surface" value="20000">Up to {formatCurrency(20000)}</option>
                  <option className="bg-surface" value="50000">Up to {formatCurrency(50000)}</option>
                  <option className="bg-surface" value="100000">Up to {formatCurrency(100000)}</option>
                </select>
              </label>
              <div className="p-2">
                <button
                  type="submit"
                  className="w-full h-full min-h-12 px-6 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-sm uppercase tracking-widest rounded-sm transition-all inline-flex items-center justify-center gap-2"
                >
                  <SearchIcon className="size-4" />
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function CategoriesStrip({ facets }: { facets?: PropertyFacets }) {
  const counts = new Map(facets?.categories.map((item) => [item.key, item.count]) ?? []);
  return (
    <section className="border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              to="/explore"
              search={{ cat: c.key } as never}
              className="group shrink-0 inline-flex items-center gap-3 px-4 py-2.5 border border-border rounded-sm hover:bg-surface-hi hover:border-foreground/30 transition-colors"
            >
              <span className="text-sm font-medium">{c.label}</span>
              <span className="text-[10px] font-mono text-muted-foreground tracking-wider">
                {(counts.get(c.key) ?? 0).toLocaleString()}
              </span>
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
  items,
  isLoading,
  isError,
  retry,
  exploreSearch,
}: {
  label: string;
  title: string;
  items: Property[];
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
  exploreSearch?: Record<string, unknown>;
}) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <div className="flex justify-between items-end mb-12">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            {label}
          </span>
          <h2 className="font-display text-3xl md:text-4xl mt-3 tracking-tight">
            {title}
          </h2>
        </div>
        <Link
          to="/explore"
          search={exploreSearch as never}
          className="hidden sm:inline-flex text-sm font-medium border-b border-foreground pb-1 hover:text-accent hover:border-accent transition-colors"
        >
          View Listings
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
            className="bg-foreground text-background px-5 py-2.5 text-sm font-semibold rounded-sm hover:opacity-80 transition-opacity"
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="border border-border bg-surface p-12 text-center">
          <p className="text-sm text-muted-foreground">No listings found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-14">
          {items.map((p, i) => (
            <PropertyCard key={p.id} property={p} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}

const CITY_BANNER_IMAGES = [
  "https://images.unsplash.com/photo-1660791601899-f79f14cc427d?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80",
];

const CITY_BANNER_BY_NAME: Record<string, string> = {
  dehradun: "https://images.unsplash.com/photo-1660791601899-f79f14cc427d?auto=format&fit=crop&w=1400&q=80",
  uttarakhand: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1400&q=80",
  "prem nagar": "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80",
  mussoorie: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80",
  delhi: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1400&q=80",
  mumbai: "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=1400&q=80",
  bengaluru: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1400&q=80",
  bangalore: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1400&q=80",
};

function cityImage(name: string, index: number) {
  const normalized = name.toLowerCase();
  const matched = Object.entries(CITY_BANNER_BY_NAME).find(([key]) => normalized.includes(key));
  if (matched) return matched[1];

  const hash = [...normalized].reduce((total, character) => total + character.charCodeAt(0), index);
  return CITY_BANNER_IMAGES[Math.abs(hash) % CITY_BANNER_IMAGES.length];
}

function CitiesBento({ facets }: { facets?: PropertyFacets }) {
  const cities = facets?.cities.slice(0, 3) ?? [];
  if (cities.length === 0) return null;

  return (
    <section className="bg-surface border-y border-border py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
              Where we live
            </span>
            <h2 className="font-display text-3xl md:text-4xl mt-3 tracking-tight">
              Active Cities
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-[420px] md:h-[500px]">
          {cities.map((c, index) => (
            <Link
              key={c.name}
              to="/explore"
              search={{ q: c.name } as never}
              className={cn(
                "relative overflow-hidden group border border-border",
                index === 0 && "col-span-2",
              )}
            >
              <img
                src={cityImage(c.name, index)}
                alt={c.name}
                loading="lazy"
                className="size-full object-cover transition-transform duration-700 ease-[var(--ease-expo)] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent p-6 flex flex-col justify-end">
                <h4 className="font-display text-2xl md:text-3xl tracking-tight">
                  {c.name}
                </h4>
                <p className="text-mono-eyebrow mt-2">
                  {c.count.toLocaleString()} Listings
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    icon: SearchIcon,
    label: "01 / Search",
    title: "Find what fits",
    body: "Filter by city, budget, type and amenities. Saved properties sync to your account.",
  },
  {
    icon: ShieldCheck,
    label: "02 / Verify",
    title: "Talk to owners",
    body: "Verified listings connect you directly with owners and property managers.",
  },
  {
    icon: KeyRound,
    label: "03 / Move in",
    title: "Request and settle",
    body: "Send booking requests and keep every conversation in your dashboard.",
  },
];

function HowItWorks() {
  return (
    <section className="border-y border-border bg-background">
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="max-w-2xl mb-16">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            How Roomzly works
          </span>
          <h2 className="font-display text-3xl md:text-5xl mt-3 tracking-tight leading-[1.05]">
            A considered path<br />
            <span className="text-muted-foreground">from search to keys.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.7,
                delay: i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="bg-background p-8 md:p-10"
            >
              <s.icon className="size-6 text-accent mb-8" />
              <p className="text-mono-eyebrow mb-4">{s.label}</p>
              <h3 className="font-display text-2xl mb-3 tracking-tight">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats({ facets }: { facets?: PropertyFacets }) {
  const stats = [
    { v: (facets?.total ?? 0).toLocaleString(), l: "Active properties" },
    { v: (facets?.verified ?? 0).toLocaleString(), l: "Verified properties" },
    { v: (facets?.premium ?? 0).toLocaleString(), l: "Premium listings" },
    { v: (facets?.cities.length ?? 0).toLocaleString(), l: "Cities" },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
        {stats.map((s, i) => (
          <motion.div
            key={s.l}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.08 }}
          >
            <p className="font-display text-5xl md:text-6xl font-bold tracking-tighter mb-2">
              {s.v}
            </p>
            <p className="text-mono-eyebrow">{s.l}</p>
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
    <section className="max-w-7xl mx-auto px-6 pb-24">
      <div className="border border-border p-10 md:p-16 bg-surface relative overflow-hidden">
        <Sparkles className="size-5 text-accent mb-6" />
        <h2 className="font-display text-3xl md:text-5xl tracking-tight max-w-2xl leading-[1.05]">
          Own a space worth showing?
        </h2>
        <p className="text-muted-foreground mt-4 max-w-xl">
          Roomzly hosts verified owners and keeps every listing tied to a real account.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {canManageListings ? (
            <Link
              to="/dashboard/add-property"
              className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-3 text-sm font-semibold rounded-sm hover:opacity-80 transition-opacity"
            >
              List your property
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <Link
              to={user ? "/dashboard" : "/auth/signup"}
              className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-3 text-sm font-semibold rounded-sm hover:opacity-80 transition-opacity"
            >
              {user ? "Open dashboard" : "Create owner account"}
              <ArrowRight className="size-4" />
            </Link>
          )}
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 border border-border px-5 py-3 text-sm font-medium rounded-sm hover:bg-surface-hi transition-colors"
          >
            Explore the marketplace
          </Link>
        </div>
      </div>
    </section>
  );
}
