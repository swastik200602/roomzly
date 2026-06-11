import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Search as SearchIcon, ShieldCheck, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";

import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyGridSkeleton } from "@/components/property/PropertyCardSkeleton";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { LocationScanningState, RoomzlyEmptyState, RoomzlyErrorState } from "@/components/ui/premium-states";
import { propertiesApi } from "@/lib/api/properties";
import { COLLEGES, STUDENT_AREAS, collegeBySlug } from "@/lib/college-discovery";
import { formatCurrency } from "@/lib/currency";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { CATEGORIES, categoryLabel } from "@/lib/properties";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  q: z.string().optional(),
  cat: z.string().optional(),
  collegeSlug: z.string().optional(),
  city: z.string().optional(),
  locality: z.string().optional(),
  neighborhood: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  premium: z.coerce.number().optional(),
  verified: z.coerce.number().optional(),
  ownerVerified: z.coerce.number().optional(),
  studentFriendly: z.coerce.number().optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
});

const AMENITIES = ["Meals", "Wifi", "Laundry", "Housekeeping", "Security", "Parking", "Balcony", "AC"];
const PAGE_SIZE = 6;

export const Route = createFileRoute("/explore")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Explore student-friendly rentals - Roomzly" },
      {
        name: "description",
        content:
          "Search verified rooms, PGs, flats, and campus-friendly rentals by college, budget, type, and trust signals on Roomzly.",
      },
      { property: "og:title", content: "Explore student-friendly rentals - Roomzly" },
      {
        property: "og:description",
        content: "Find verified listings near UPES, Graphic Era, DIT, JBIT, BFIT, DBS, and Tula's Institute.",
      },
    ],
  }),
  component: ExplorePage,
});

function ExplorePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/explore" });

  const [q, setQ] = useState(search.q ?? "");
  const [cat, setCat] = useState<string | undefined>(search.cat);
  const [collegeSlug, setCollegeSlug] = useState<string | undefined>(search.collegeSlug);
  const [budget, setBudget] = useState<[number, number]>([search.min ?? 0, search.max ?? 30000]);
  const [beds, setBeds] = useState<number | "any">("any");
  const [activeAmen, setActiveAmen] = useState<string[]>([]);
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(Boolean(search.verified));
  const [ownerVerifiedOnly, setOwnerVerifiedOnly] = useState(Boolean(search.ownerVerified));
  const [studentFriendlyOnly, setStudentFriendlyOnly] = useState(Boolean(search.studentFriendly));

  const debouncedQ = useDebouncedValue(q.trim(), 300);
  const debouncedBudget = useDebouncedValue(budget, 250);
  const amenitiesKey = activeAmen.join(",");

  const facetsQuery = useQuery({
    queryKey: ["properties", "facets"],
    queryFn: propertiesApi.facets,
  });

  const propertiesQuery = useQuery({
    queryKey: [
      "properties",
      "explore",
      {
        q: debouncedQ,
        cat,
        collegeSlug,
        verifiedOnly,
        ownerVerifiedOnly,
        studentFriendlyOnly,
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
        collegeSlug,
        city: search.city,
        locality: search.locality,
        neighborhood: search.neighborhood,
        state: search.state,
        country: search.country,
        premium: search.premium,
        verified: verifiedOnly || search.verified ? true : undefined,
        ownerVerified: ownerVerifiedOnly || search.ownerVerified ? true : undefined,
        studentFriendly: studentFriendlyOnly || search.studentFriendly ? true : undefined,
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

  const categoryCounts = useMemo(
    () => new Map(facetsQuery.data?.categories.map((item) => [item.key, item.count]) ?? []),
    [facetsQuery.data?.categories],
  );
  const collegeOptions = facetsQuery.data?.colleges.length ? facetsQuery.data.colleges : COLLEGES;

  const totalPages = propertiesQuery.data?.meta.totalPages ?? 1;
  const resultCount = propertiesQuery.data?.meta.total ?? 0;
  const resultCollege = propertiesQuery.data?.meta.college;
  const paginated = propertiesQuery.data?.data ?? [];
  const selectedCollege = collegeBySlug(collegeSlug) ?? (resultCollege ? collegeBySlug(resultCollege.slug) : undefined);
  const ownerVerifiedCount = paginated.filter((property) => property.owner.verified).length;
  const studentPicksCount = paginated.filter((property) => property.popularAmongStudents).length;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    navigate({
      search: {
        q: q.trim() || undefined,
        cat: cat || undefined,
        collegeSlug: collegeSlug || undefined,
        verified: verifiedOnly ? 1 : undefined,
        ownerVerified: ownerVerifiedOnly ? 1 : undefined,
        studentFriendly: studentFriendlyOnly ? 1 : undefined,
        min: budget[0] || undefined,
        max: budget[1] !== 30000 ? budget[1] : undefined,
      } as never,
    });
  };

  const resetAll = () => {
    setQ("");
    setCat(undefined);
    setCollegeSlug(undefined);
    setBudget([0, 30000]);
    setBeds("any");
    setActiveAmen([]);
    setVerifiedOnly(false);
    setOwnerVerifiedOnly(false);
    setStudentFriendlyOnly(false);
    setPage(1);
    navigate({ search: {} as never });
  };

  const chips = [
    q.trim() ? { label: `Search: ${q.trim()}`, onClear: () => setQ("") } : null,
    selectedCollege ? { label: `Near ${selectedCollege.shortName}`, onClear: () => setCollegeSlug(undefined) } : null,
    cat ? { label: categoryLabel(cat), onClear: () => setCat(undefined) } : null,
    verifiedOnly ? { label: "Verified listings", onClear: () => setVerifiedOnly(false) } : null,
    ownerVerifiedOnly ? { label: "Verified owners", onClear: () => setOwnerVerifiedOnly(false) } : null,
    studentFriendlyOnly ? { label: "Student fit", onClear: () => setStudentFriendlyOnly(false) } : null,
    budget[1] !== 30000 ? { label: `Budget <= ${formatCurrency(budget[1])}`, onClear: () => setBudget([budget[0], 30000]) } : null,
    beds !== "any" ? { label: `${beds}+ beds`, onClear: () => setBeds("any") } : null,
    ...activeAmen.map((amenity) => ({
      label: amenity,
      onClear: () => setActiveAmen((current) => current.filter((item) => item !== amenity)),
    })),
  ].filter(Boolean) as Array<{ label: string; onClear: () => void }>;

  const filtersPanel = (
    <FiltersPanel
      cat={cat}
      setCat={(value) => {
        setCat(value);
        setPage(1);
      }}
      collegeSlug={collegeSlug}
      setCollegeSlug={(value) => {
        setCollegeSlug(value);
        setPage(1);
      }}
      budget={budget}
      setBudget={(value) => {
        setBudget(value);
        setPage(1);
      }}
      beds={beds}
      setBeds={(value) => {
        setBeds(value);
        setPage(1);
      }}
      activeAmen={activeAmen}
      setActiveAmen={(value) => {
        setActiveAmen(value);
        setPage(1);
      }}
      verifiedOnly={verifiedOnly}
      setVerifiedOnly={(value) => {
        setVerifiedOnly(value);
        setPage(1);
      }}
      ownerVerifiedOnly={ownerVerifiedOnly}
      setOwnerVerifiedOnly={(value) => {
        setOwnerVerifiedOnly(value);
        setPage(1);
      }}
      studentFriendlyOnly={studentFriendlyOnly}
      setStudentFriendlyOnly={(value) => {
        setStudentFriendlyOnly(value);
        setPage(1);
      }}
      categoryCounts={categoryCounts}
      collegeOptions={collegeOptions}
    />
  );

  return (
    <div className="animate-fade-in">
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.6fr_1fr_auto_auto]">
              <div className="flex min-w-[240px] items-center gap-2 border border-border bg-background px-3 h-11">
                <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  placeholder="Search locality, room type, or college area"
                  className="w-full bg-transparent text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none"
                />
              </div>
              <label className="flex items-center gap-2 border border-border bg-background px-3 h-11">
                <GraduationCap className="size-4 shrink-0 text-muted-foreground" />
                <select
                  value={collegeSlug ?? ""}
                  onChange={(event) => setCollegeSlug(event.target.value || undefined)}
                  className="w-full bg-transparent text-sm font-medium focus:outline-none"
                >
                  <option value="">Browse by college</option>
                  {collegeOptions.map((college) => (
                    <option key={college.slug} value={college.slug}>
                      {college.shortName}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="h-11 px-5 bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="h-11 px-4 border border-border inline-flex items-center gap-2 text-sm font-mono uppercase tracking-widest hover:bg-surface-hi lg:hidden"
              >
                <SlidersHorizontal className="size-4" />
                Filters
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {collegeOptions.slice(0, 7).map((college) => (
                <button
                  key={college.slug}
                  type="button"
                  onClick={() => {
                    setCollegeSlug(college.slug);
                    setPage(1);
                  }}
                  className={cn(
                    "border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
                    collegeSlug === college.slug && "border-foreground bg-surface-hi text-foreground",
                  )}
                >
                  Near {college.shortName}
                </button>
              ))}
            </div>
          </form>
        </div>
      </section>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[88vw] overflow-y-auto border-r border-border bg-background p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-lg tracking-tight">Filters</h2>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setMobileFiltersOpen(false)}
                className="grid size-9 place-items-center border border-border hover:bg-surface-hi"
              >
                <X className="size-4" />
              </button>
            </div>
            {filtersPanel}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 bg-foreground px-4 py-3 text-sm font-semibold text-background"
              >
                Show results
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="border border-border px-4 py-3 text-sm font-medium"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-1 gap-10 lg:grid-cols-[300px_1fr]">
        <aside className="hidden lg:block lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto pr-1">
          {filtersPanel}
        </aside>

        <section>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {chips.length > 0 ? (
              <>
                {chips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={chip.onClear}
                    className="inline-flex items-center gap-2 border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {chip.label}
                    <X className="size-3" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={resetAll}
                  className="text-xs font-medium text-accent underline-offset-4 hover:underline"
                >
                  Reset all
                </button>
              </>
            ) : (
              STUDENT_AREAS.map((area) => (
                <button
                  key={area.label}
                  type="button"
                  onClick={() =>
                    navigate({
                      search: {
                        city: area.search.city,
                        locality: area.search.locality,
                        cat: area.search.cat,
                      } as never,
                    })
                  }
                  className="border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  {area.label}
                </button>
              ))
            )}
          </div>

          <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-mono-eyebrow mb-2">
                {propertiesQuery.isLoading ? "Loading" : `${resultCount.toLocaleString()} results`}
              </p>
              <h1 className="font-display text-2xl md:text-3xl tracking-tight">
                {resultCollege ? `Rooms and PGs near ${resultCollege.shortName}` : categoryLabel(cat)}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {resultCollege
                  ? `Verified listings around ${resultCollege.areaName}, with distance from campus and trust signals that help students shortlist faster.`
                  : "Compare verified listings, owner trust, and student-friendly details before you contact anyone."}
              </p>
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
              className="h-10 w-full border border-border bg-background px-3 text-xs font-mono uppercase text-foreground focus:outline-none focus:ring-1 focus:ring-ring xl:w-52"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest</option>
              <option value="popular">Most viewed</option>
            </select>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TrustStat
              icon={<Badge variant="outline" className="border-border bg-background text-foreground">Trust</Badge>}
              label="Verified listings"
              value={paginated.filter((property) => property.verified).length.toString()}
            />
            <TrustStat
              icon={<ShieldCheck className="size-4 text-accent" />}
              label="Verified owners in view"
              value={ownerVerifiedCount.toString()}
            />
            <TrustStat
              icon={<Sparkles className="size-4 text-accent" />}
              label="Student picks in view"
              value={studentPicksCount.toString()}
            />
          </div>

          {propertiesQuery.isFetching && !propertiesQuery.isLoading && (
            <div className="mb-6">
              <LocationScanningState
                message={resultCollege ? `Refreshing listings near ${resultCollege.shortName}...` : "Searching verified spaces..."}
              />
            </div>
          )}

          {propertiesQuery.isLoading ? (
            <PropertyGridSkeleton count={PAGE_SIZE} />
          ) : propertiesQuery.isError ? (
            <RoomzlyErrorState
              title="We couldn't refresh the student housing map"
              description="Try again and Roomzly will reconnect to the latest verified listings."
              onAction={() => propertiesQuery.refetch()}
            />
          ) : paginated.length === 0 ? (
            <EmptyResults
              collegeName={selectedCollege?.shortName}
              onReset={resetAll}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
                {paginated.map((property, index) => (
                  <PropertyCard key={property.id} property={property} index={index} />
                ))}
              </div>
              {totalPages > 1 && (
                <Pagination className="mt-12">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setPage((current) => Math.max(1, current - 1));
                        }}
                        className={cn(page === 1 && "pointer-events-none opacity-40")}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, index) => (
                      <PaginationItem key={index}>
                        <PaginationLink
                          href="#"
                          isActive={page === index + 1}
                          onClick={(event) => {
                            event.preventDefault();
                            setPage(index + 1);
                          }}
                        >
                          {index + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setPage((current) => Math.min(totalPages, current + 1));
                        }}
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
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
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
  collegeSlug,
  setCollegeSlug,
  budget,
  setBudget,
  beds,
  setBeds,
  activeAmen,
  setActiveAmen,
  verifiedOnly,
  setVerifiedOnly,
  ownerVerifiedOnly,
  setOwnerVerifiedOnly,
  studentFriendlyOnly,
  setStudentFriendlyOnly,
  categoryCounts,
  collegeOptions,
}: {
  cat: string | undefined;
  setCat: (value: string | undefined) => void;
  collegeSlug: string | undefined;
  setCollegeSlug: (value: string | undefined) => void;
  budget: [number, number];
  setBudget: (value: [number, number]) => void;
  beds: number | "any";
  setBeds: (value: number | "any") => void;
  activeAmen: string[];
  setActiveAmen: (value: string[]) => void;
  verifiedOnly: boolean;
  setVerifiedOnly: (value: boolean) => void;
  ownerVerifiedOnly: boolean;
  setOwnerVerifiedOnly: (value: boolean) => void;
  studentFriendlyOnly: boolean;
  setStudentFriendlyOnly: (value: boolean) => void;
  categoryCounts: Map<string, number>;
  collegeOptions: Array<{ slug: string; name: string; shortName: string; areaName: string }>;
}) {
  return (
    <div className="space-y-8">
      <FilterBlock title="College" icon={<GraduationCap className="size-3.5" />}>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setCollegeSlug(undefined)}
            className={cn(
              "w-full border border-border px-3 py-2 text-left text-sm transition-colors hover:border-foreground/30",
              !collegeSlug && "border-foreground bg-surface-hi",
            )}
          >
            Any college
          </button>
          {collegeOptions.map((college) => (
            <button
              key={college.slug}
              type="button"
              onClick={() => setCollegeSlug(college.slug)}
              className={cn(
                "flex w-full items-center justify-between border border-border px-3 py-2 text-left text-sm transition-colors hover:border-foreground/30",
                collegeSlug === college.slug && "border-foreground bg-surface-hi",
              )}
            >
              <span>{college.shortName}</span>
              <span className="text-[10px] font-mono uppercase text-muted-foreground">{college.areaName}</span>
            </button>
          ))}
        </div>
      </FilterBlock>

      <FilterBlock title="Trust" icon={<ShieldCheck className="size-3.5" />}>
        <div className="flex flex-wrap gap-2">
          <FilterToggle label="Verified listing" active={verifiedOnly} onClick={() => setVerifiedOnly(!verifiedOnly)} />
          <FilterToggle label="Verified owner" active={ownerVerifiedOnly} onClick={() => setOwnerVerifiedOnly(!ownerVerifiedOnly)} />
          <FilterToggle label="Student fit" active={studentFriendlyOnly} onClick={() => setStudentFriendlyOnly(!studentFriendlyOnly)} />
        </div>
      </FilterBlock>

      <FilterBlock title="Category" icon={<SlidersHorizontal className="size-3.5" />}>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setCat(undefined)}
            className={cn(
              "w-full border border-border px-3 py-2 text-left text-sm transition-colors hover:border-foreground/30",
              !cat && "border-foreground bg-surface-hi",
            )}
          >
            All categories
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category.key}
              type="button"
              onClick={() => setCat(category.key)}
              className={cn(
                "flex w-full items-center justify-between border border-border px-3 py-2 text-left text-sm transition-colors hover:border-foreground/30",
                cat === category.key && "border-foreground bg-surface-hi",
              )}
            >
              <span>{category.label}</span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {(categoryCounts.get(category.key) ?? 0).toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </FilterBlock>

      <FilterBlock title="Budget / month">
        <div className="space-y-4">
          <div className="flex items-center justify-between font-mono text-xs">
            <span>{formatCurrency(budget[0])}</span>
            <span>{formatCurrency(budget[1])}</span>
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
        <div className="flex flex-wrap gap-2">
          {(["any", 1, 2, 3, 4] as const).map((value) => (
            <FilterToggle
              key={String(value)}
              label={value === "any" ? "Any" : `${value}+`}
              active={beds === value}
              onClick={() => setBeds(value)}
            />
          ))}
        </div>
      </FilterBlock>

      <FilterBlock title="Amenities">
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((amenity) => {
            const active = activeAmen.includes(amenity);
            return (
              <FilterToggle
                key={amenity}
                label={amenity}
                active={active}
                onClick={() =>
                  setActiveAmen(active ? activeAmen.filter((item) => item !== amenity) : [...activeAmen, amenity])
                }
              />
            );
          })}
        </div>
      </FilterBlock>
    </div>
  );
}

function FilterToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border border-border px-3 py-2 text-xs font-medium transition-colors hover:border-foreground/30",
        active && "border-foreground bg-surface-hi text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function TrustStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-display text-3xl tracking-tight">{value}</p>
    </div>
  );
}

function EmptyResults({
  collegeName,
  onReset,
}: {
  collegeName?: string;
  onReset: () => void;
}) {
  return (
    <RoomzlyEmptyState
      eyebrow="No strong match yet"
      title={collegeName ? `No listings are matching near ${collegeName}` : "We couldn't find a space for those filters"}
      description={
        collegeName
          ? `Try a wider budget, remove trust filters, or switch to another nearby student area.`
          : "Loosen the filters, try a nearby locality, or reset the search to see every available Roomzly listing."
      }
      actionLabel="Reset filters"
      onAction={onReset}
    />
  );
}
