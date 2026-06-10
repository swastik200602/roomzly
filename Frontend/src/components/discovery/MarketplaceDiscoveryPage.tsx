import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Search, ShieldCheck, SlidersHorizontal, Sparkles, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { PropertyCard } from "@/components/property/PropertyCard";
import { SeoJsonLd } from "@/components/static/InfoPage";
import { propertiesApi, type PropertyListParams } from "@/lib/api/properties";
import { CATEGORIES, categoryLabel } from "@/lib/properties";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type FilterPreset = "premium" | "verified" | "pg" | "location";

type MarketplaceDiscoveryPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  seoDescription: string;
  baseParams: PropertyListParams;
  preset: FilterPreset;
  locationName?: string;
  categoryName?: string;
  highlights?: string[];
};

const AMENITIES = ["Meals", "Wifi", "Laundry", "Housekeeping", "Security", "Parking", "Gym", "Balcony", "AC"];

export function MarketplaceDiscoveryPage({
  eyebrow,
  title,
  intro,
  seoDescription,
  baseParams,
  preset,
  locationName,
  categoryName,
  highlights = [],
}: MarketplaceDiscoveryPageProps) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | undefined>(baseParams.cat);
  const [sort, setSort] = useState("featured");
  const [beds, setBeds] = useState<number | "any">("any");
  const [activeAmen, setActiveAmen] = useState<string[]>([]);
  const [max, setMax] = useState<number | "any">("any");
  const debouncedQ = useDebouncedValue(q.trim(), 300);
  const amenitiesKey = activeAmen.join(",");

  const params = useMemo<PropertyListParams>(
    () => ({
      ...baseParams,
      q: debouncedQ || baseParams.q,
      cat: cat || baseParams.cat,
      beds: beds === "any" ? undefined : beds,
      max: max === "any" ? undefined : max,
      amenities: activeAmen,
      sort,
      limit: 12,
    }),
    [activeAmen, baseParams, beds, cat, debouncedQ, max, sort],
  );

  const propertiesQuery = useQuery({
    queryKey: [
      "properties",
      "discovery",
      baseParams,
      debouncedQ,
      cat,
      beds,
      max,
      amenitiesKey,
      sort,
    ],
    queryFn: () => propertiesApi.list(params),
    placeholderData: (previous) => previous,
  });

  const properties = propertiesQuery.data?.data ?? [];
  const total = propertiesQuery.data?.meta.total ?? 0;
  const mapped = properties.filter((property) => property.latitude != null && property.longitude != null).length;
  const verified = properties.filter((property) => property.verified).length;
  const premium = properties.filter((property) => property.premium).length;

  return (
    <div className="animate-fade-in">
      <SeoJsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          description: seoDescription,
          spatialCoverage: locationName,
          about: categoryName,
          provider: { "@type": "Organization", name: "Roomzly" },
        }}
      />
      <section className="border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="text-mono-eyebrow mb-3">{eyebrow}</p>
              <h1 className="font-display text-4xl sm:text-6xl tracking-tighter font-bold max-w-4xl leading-none">
                {title}
              </h1>
              <p className="text-muted-foreground mt-5 max-w-2xl leading-relaxed">{intro}</p>
            </div>
            <div className="grid grid-cols-3 gap-px bg-border border border-border">
              <Stat label="Results" value={propertiesQuery.isLoading ? "..." : total.toLocaleString()} />
              <Stat label="Verified" value={verified.toLocaleString()} />
              <Stat label="Mapped" value={mapped.toLocaleString()} />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-mono-eyebrow mr-2">Popular searches</span>
            {[
              { to: "/rooms-in-dehradun", label: "Rooms in Dehradun" },
              { to: "/pg-in-dehradun", label: "PG in Dehradun" },
              { to: "/pg-in-prem-nagar", label: "PG in Prem Nagar" },
              { to: "/flats-in-dehradun", label: "Flats in Dehradun" },
              { to: "/properties-in-uttarakhand", label: "Properties in Uttarakhand" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                preload={false}
                className="rounded-sm border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
            <div className="border border-border bg-surface p-4 space-y-4">
              <p className="text-mono-eyebrow inline-flex items-center gap-2">
                <SlidersHorizontal className="size-3.5" />
                Filters
              </p>
              <div className="flex items-center gap-2 border border-border bg-background px-3 py-2.5">
                <Search className="size-4 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  placeholder="Search within results"
                  className="w-full bg-transparent text-sm focus:outline-none"
                />
              </div>
              {preset !== "pg" && (
                <label className="block">
                  <span className="text-mono-eyebrow block mb-2">Type</span>
                  <select
                    value={cat ?? ""}
                    onChange={(event) => setCat(event.target.value || undefined)}
                    className="w-full bg-background border border-border px-3 py-2.5 text-sm rounded-sm"
                  >
                    <option value="">All property types</option>
                    {CATEGORIES.map((category) => (
                      <option key={category.key} value={category.key}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="block">
                <span className="text-mono-eyebrow block mb-2">Budget</span>
                <select
                  value={max}
                  onChange={(event) => setMax(event.target.value === "any" ? "any" : Number(event.target.value))}
                  className="w-full bg-background border border-border px-3 py-2.5 text-sm rounded-sm"
                >
                  <option value="any">Any budget</option>
                  <option value="20000">Up to {formatCurrency(20000)}</option>
                  <option value="50000">Up to {formatCurrency(50000)}</option>
                  <option value="100000">Up to {formatCurrency(100000)}</option>
                  <option value="250000">Up to {formatCurrency(250000)}</option>
                </select>
              </label>
              <label className="block">
                <span className="text-mono-eyebrow block mb-2">Bedrooms</span>
                <select
                  value={beds}
                  onChange={(event) => setBeds(event.target.value === "any" ? "any" : Number(event.target.value))}
                  className="w-full bg-background border border-border px-3 py-2.5 text-sm rounded-sm"
                >
                  <option value="any">Any beds</option>
                  <option value="1">1+ bed</option>
                  <option value="2">2+ beds</option>
                  <option value="3">3+ beds</option>
                </select>
              </label>
              <label className="block">
                <span className="text-mono-eyebrow block mb-2">Sort</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="w-full bg-background border border-border px-3 py-2.5 text-sm rounded-sm"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price low to high</option>
                  <option value="price-desc">Price high to low</option>
                  <option value="newest">Newest</option>
                  <option value="popular">Most viewed</option>
                </select>
              </label>
              <div>
                <span className="text-mono-eyebrow block mb-2">{preset === "pg" ? "PG amenities" : "Amenities"}</span>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.map((amenity) => {
                    const active = activeAmen.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() =>
                          setActiveAmen(active ? activeAmen.filter((item) => item !== amenity) : [...activeAmen, amenity])
                        }
                        className={cn(
                          "border border-border px-2.5 py-1.5 text-xs rounded-sm hover:bg-surface-hi",
                          active && "bg-accent text-accent-foreground border-accent",
                        )}
                      >
                        {amenity}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border border-border bg-surface p-4">
              <p className="text-mono-eyebrow mb-3">Trust signals</p>
              <div className="space-y-3 text-sm text-muted-foreground">
                <TrustRow icon={<BadgeCheck className="size-4" />} label={`${verified} verified listings in this view`} />
                <TrustRow icon={<Sparkles className="size-4" />} label={`${premium} premium homes in this view`} />
                <TrustRow icon={<ShieldCheck className="size-4" />} label="Report and owner verification tools active" />
              </div>
            </div>
          </aside>

          <main>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
              <div>
                <p className="text-mono-eyebrow mb-2">
                  {propertiesQuery.isLoading ? "Loading" : `${total.toLocaleString()} matching listings`}
                </p>
                <h2 className="font-display text-2xl sm:text-3xl tracking-tight">
                  {cat ? categoryLabel(cat) : categoryName || "Properties"}
                </h2>
              </div>
              {highlights.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {highlights.slice(0, 3).map((highlight) => (
                    <span key={highlight} className="border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground">
                      {highlight}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {propertiesQuery.isLoading ? (
              <DiscoveryState eyebrow="Loading" title="Finding matching listings" body="Roomzly is loading real marketplace inventory for this page." />
            ) : propertiesQuery.isError ? (
              <DiscoveryState
                eyebrow="Error"
                title="Could not load listings"
                body="Check the backend connection and try again."
                action={<button onClick={() => propertiesQuery.refetch()} className="bg-foreground text-background px-5 py-2.5 text-sm font-semibold rounded-sm">Retry</button>}
              />
            ) : properties.length === 0 ? (
              <DiscoveryState
                eyebrow="No matches"
                title="No listings fit these filters yet"
                body="Reset filters or open the full explore page to broaden your search."
                action={<Link to="/explore" className="bg-foreground text-background px-5 py-2.5 text-sm font-semibold rounded-sm">Open Explore</Link>}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-12">
                {properties.map((property, index) => (
                  <PropertyCard key={property.id} property={property} index={index} />
                ))}
              </div>
            )}
          </main>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background p-4">
      <p className="text-mono-eyebrow mb-2">{label}</p>
      <p className="font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function TrustRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-accent">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function DiscoveryState({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow: string;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border border-border bg-surface p-10 text-center">
      <p className="text-mono-eyebrow mb-3">{eyebrow}</p>
      <h3 className="font-display text-3xl tracking-tight mb-3">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">{body}</p>
      {action}
    </div>
  );
}
