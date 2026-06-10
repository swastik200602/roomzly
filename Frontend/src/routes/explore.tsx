import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { z } from "zod";

import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyGridSkeleton } from "@/components/property/PropertyCardSkeleton";
import { LocationScanningState, RoomzlyEmptyState, RoomzlyErrorState } from "@/components/ui/premium-states";
import { CATEGORIES, categoryLabel } from "@/lib/properties";
import { propertiesApi } from "@/lib/api/properties";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationLink } from "@/components/ui/pagination";
import { formatCurrency } from "@/lib/currency";

const searchSchema = z.object({
  q: z.string().optional(),
  cat: z.string().optional(),
  city: z.string().optional(),
  locality: z.string().optional(),
  neighborhood: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  premium: z.coerce.number().optional(),
  verified: z.coerce.number().optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
});

export const Route = createFileRoute("/explore")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Explore properties - Roomzly" },
      {
        name: "description",
        content:
          "Browse verified apartments, villas, PGs and more. Filter by city, budget, type, and amenities.",
      },
      { property: "og:title", content: "Explore properties - Roomzly" },
      {
        property: "og:description",
        content: "Curated, filterable property search across global destinations.",
      },
    ],
  }),
  component: ExplorePage,
});

const AMENITIES = ["Pool", "Gym", "Parking", "Pet friendly", "Wifi", "Balcony", "Lift", "AC"];
const PAGE_SIZE = 6;

function ExplorePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/explore" });

  const [q, setQ] = useState(search.q ?? "");
  const [cat, setCat] = useState<string | undefined>(search.cat);
  const [budget, setBudget] = useState<[number, number]>([
    search.min ?? 0,
    search.max ?? 30000,
  ]);
  const [beds, setBeds] = useState<number | "any">("any");
  const [activeAmen, setActiveAmen] = useState<string[]>([]);
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const debouncedQ = useDebouncedValue(q.trim(), 300);
  const debouncedBudget = useDebouncedValue(budget, 250);
  const amenitiesKey = activeAmen.join(",");

  const facetsQuery = useQuery({
    queryKey: ["properties", "facets"],
    queryFn: propertiesApi.facets,
  });
  const categoryCounts = useMemo(
    () => new Map(facetsQuery.data?.categories.map((item) => [item.key, item.count]) ?? []),
    [facetsQuery.data?.categories],
  );
  const propertiesQuery = useQuery({
    queryKey: [
      "properties",
      {
        q: debouncedQ,
        cat,
        premium: search.premium,
        verified: search.verified,
        budgetMin: debouncedBudget[0],
        budgetMax: debouncedBudget[1],
        beds,
        amenitiesKey,
        sort,
        page,
      },
    ],
    queryFn: () =>
      propertiesApi.list({
        q: debouncedQ || undefined,
        cat: cat || undefined,
        city: search.city,
        locality: search.locality,
        neighborhood: search.neighborhood,
        state: search.state,
        country: search.country,
        premium: search.premium,
        verified: search.verified,
        min: debouncedBudget[0] || undefined,
        max: debouncedBudget[1] !== 30000 ? debouncedBudget[1] : undefined,
        beds: beds === "any" ? undefined : beds,
        amenities: activeAmen,
        sort,
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: (previous) => previous,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    navigate({
      search: {
        q: q.trim() || undefined,
        cat: cat || undefined,
        min: budget[0] || undefined,
        max: budget[1] !== 30000 ? budget[1] : undefined,
      } as never,
    });
  };

  const totalPages = propertiesQuery.data?.meta.totalPages ?? 1;
  const paginated = propertiesQuery.data?.data ?? [];
  const resultCount = propertiesQuery.data?.meta.total ?? 0;
  const filtersPanel = (
    <FiltersPanel
      cat={cat}
      setCat={(value) => { setCat(value); setPage(1); }}
      budget={budget}
      setBudget={(value) => { setBudget(value); setPage(1); }}
      beds={beds}
      setBeds={(value) => { setBeds(value); setPage(1); }}
      activeAmen={activeAmen}
      setActiveAmen={(value) => { setActiveAmen(value); setPage(1); }}
      categoryCounts={categoryCounts}
    />
  );

  return (
    <div className="animate-fade-in">
      <section className="border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <form onSubmit={submit} className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[240px] flex items-center gap-2 border border-border bg-background rounded-sm px-3 h-11">
              <SearchIcon className="size-4 text-muted-foreground shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search city, neighborhood, or building"
                className="bg-transparent w-full text-sm font-medium focus:outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            <button
              type="submit"
              className="h-11 px-5 bg-accent text-accent-foreground text-sm font-semibold rounded-sm hover:bg-accent/90 transition-colors"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden h-11 px-4 border border-border rounded-sm inline-flex items-center gap-2 text-sm font-mono uppercase tracking-widest hover:bg-surface-hi"
            >
              <SlidersHorizontal className="size-4" /> Filters
            </button>
          </form>
        </div>
      </section>

      {mobileFiltersOpen && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Filters">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto border-r border-border bg-background p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-lg tracking-tight">Filters</h2>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setMobileFiltersOpen(false)}
                className="size-9 grid place-items-center rounded-sm border border-border hover:bg-surface-hi"
              >
                <X className="size-4" />
              </button>
            </div>
            {filtersPanel}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
        <aside className="hidden lg:block space-y-8 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto pr-1">
          {filtersPanel}
        </aside>

        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-mono-eyebrow mb-2">
                {propertiesQuery.isLoading ? "Loading" : `${resultCount} results`}
              </p>
              <h1 className="font-display text-2xl md:text-3xl tracking-tight">
                {categoryLabel(cat)}
              </h1>
            </div>
            <label className="sr-only" htmlFor="explore-sort">
              Sort listings
            </label>
            <select
              id="explore-sort"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
              className="h-9 w-44 rounded-sm border border-border bg-background px-3 text-xs font-mono uppercase text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest</option>
              <option value="popular">Most viewed</option>
            </select>
          </div>

          {propertiesQuery.isFetching && !propertiesQuery.isLoading && (
            <div className="mb-6">
              <LocationScanningState message="Searching verified spaces..." />
            </div>
          )}

          {propertiesQuery.isLoading ? (
            <PropertyGridSkeleton count={PAGE_SIZE} />
          ) : propertiesQuery.isError ? (
            <RoomzlyErrorState
              title="We couldn't refresh the property map"
              description="Your search is safe. Try again and Roomzly will reconnect to the latest verified spaces."
              onAction={() => propertiesQuery.refetch()}
            />
          ) : paginated.length === 0 ? (
            <EmptyResults onReset={() => { setQ(""); setCat(undefined); setBudget([0, 30000]); setBeds("any"); setActiveAmen([]); setPage(1); }} />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-12">
                {paginated.map((p, i) => (
                  <PropertyCard key={p.id} property={p} index={i} />
                ))}
              </div>
              {totalPages > 1 && (
                <Pagination className="mt-12">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }}
                        className={cn(page === 1 && "pointer-events-none opacity-40")}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          href="#"
                          isActive={page === i + 1}
                          onClick={(e) => { e.preventDefault(); setPage(i + 1); }}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }}
                        className={cn(page === totalPages && "pointer-events-none opacity-40")}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function FilterBlock({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-mono-eyebrow flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function FiltersPanel({
  cat,
  setCat,
  budget,
  setBudget,
  beds,
  setBeds,
  activeAmen,
  setActiveAmen,
  categoryCounts,
}: {
  cat: string | undefined;
  setCat: (v: string | undefined) => void;
  budget: [number, number];
  setBudget: (v: [number, number]) => void;
  beds: number | "any";
  setBeds: (v: number | "any") => void;
  activeAmen: string[];
  setActiveAmen: (v: string[]) => void;
  categoryCounts: Map<string, number>;
}) {
  return (
    <div className="space-y-8">
      <FilterBlock title="Category" icon={<SlidersHorizontal className="size-3.5" />}>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setCat(undefined)}
            className={cn(
              "text-left text-sm px-3 py-2 border border-border rounded-sm hover:border-foreground/30 transition-colors",
              !cat && "border-foreground bg-surface-hi",
            )}
          >
            All categories
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={cn(
                "text-left text-sm px-3 py-2 border border-border rounded-sm hover:border-foreground/30 transition-colors flex justify-between",
                cat === c.key && "border-foreground bg-surface-hi",
              )}
            >
              <span>{c.label}</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {(categoryCounts.get(c.key) ?? 0).toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </FilterBlock>

      <FilterBlock title="Budget / mo">
        <div className="space-y-4">
          <div className="flex items-center justify-between font-mono text-xs">
            <span>{formatCurrency(budget[0])}</span>
            <span>{formatCurrency(budget[1])}+</span>
          </div>
          <input
            type="range"
            min={0}
            max={30000}
            step={500}
            value={budget[1]}
            onChange={(event) => setBudget([budget[0], Number(event.target.value)])}
            className="w-full accent-current"
          />
        </div>
      </FilterBlock>

      <FilterBlock title="Bedrooms">
        <div className="flex gap-2 flex-wrap">
          {(["any", 1, 2, 3, 4] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBeds(b)}
              className={cn(
                "px-3 py-2 text-xs font-mono uppercase border border-border rounded-sm hover:border-foreground/30 transition-colors",
                beds === b && "border-foreground bg-surface-hi",
              )}
            >
              {b === "any" ? "Any" : `${b}+`}
            </button>
          ))}
        </div>
      </FilterBlock>

      <FilterBlock title="Amenities">
        <div className="flex gap-2 flex-wrap">
          {AMENITIES.map((a) => {
            const active = activeAmen.includes(a);
            return (
              <button
                key={a}
                onClick={() =>
                  setActiveAmen(active ? activeAmen.filter((x) => x !== a) : [...activeAmen, a])
                }
                className={cn(
                  "px-3 py-1.5 text-xs border border-border rounded-sm hover:border-foreground/30 transition-colors",
                  active && "border-foreground bg-surface-hi",
                )}
              >
                {a}
              </button>
            );
          })}
        </div>
      </FilterBlock>
    </div>
  );
}

function EmptyResults({ onReset }: { onReset: () => void }) {
  return (
    <RoomzlyEmptyState
      eyebrow="No perfect match yet"
      title="We couldn't find a space for those filters"
      description="Loosen the filters, try a nearby locality, or reset the search to see every available Roomzly listing."
      actionLabel="Reset filters"
      onAction={onReset}
    />
  );
}
