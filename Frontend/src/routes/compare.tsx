import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Check, GitCompare, GraduationCap, Phone, X } from "lucide-react";

import { propertiesApi } from "@/lib/api/properties";
import type { Property } from "@/lib/properties";
import { formatCurrency } from "@/lib/currency";
import { useCompare } from "@/stores/compare";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare properties - Roomzly" },
      { name: "description", content: "Compare trust, campus distance, and pricing across shortlisted Roomzly properties." },
    ],
  }),
  component: ComparePage,
});

const ROWS: Array<{ label: string; value: (property: Property) => string }> = [
  { label: "Price", value: (property) => `${formatCurrency(property.price)} / mo` },
  {
    label: "Locality",
    value: (property) => [property.locality, property.neighborhood, property.city].filter(Boolean).join(", "),
  },
  { label: "Category", value: (property) => property.categoryLabel },
  {
    label: "Campus distance",
    value: (property) =>
      property.primaryCollege ? `${property.primaryCollege.distanceKm} km from ${property.primaryCollege.shortName}` : "Not tagged yet",
  },
  {
    label: "Walking time",
    value: (property) => (property.primaryCollege ? `${property.primaryCollege.walkingMinutes} min` : "-"),
  },
  {
    label: "Owner trust",
    value: (property) =>
      property.owner.verified
        ? property.owner.phoneVerified
          ? "Owner verified + mobile verified"
          : "Owner verified"
        : property.owner.phoneVerified
          ? "Mobile verified"
          : "Basic owner profile",
  },
  { label: "Listing verified", value: (property) => (property.verified ? "Yes" : "No") },
  {
    label: "Student fit",
    value: (property) => (property.studentFriendlyScore != null ? `${property.studentFriendlyScore}/100` : "Not scored"),
  },
  { label: "Response rate", value: (property) => `${property.owner.responseRate}%` },
  { label: "Beds", value: (property) => String(property.beds) },
  { label: "Baths", value: (property) => String(property.baths) },
  { label: "Area", value: (property) => `${property.sqft.toLocaleString()} sqft` },
  { label: "Furnishing", value: (property) => property.furnishing },
  { label: "Rating", value: (property) => `${property.rating} (${property.reviews} reviews)` },
];

function ComparePage() {
  const ids = useCompare((state) => state.ids);
  const toggle = useCompare((state) => state.toggle);
  const itemsQuery = useQuery({
    queryKey: ["properties", "compare", ids],
    queryFn: () => propertiesApi.batch(ids),
    enabled: ids.length > 0,
  });
  const items = itemsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 animate-fade-in">
      <div className="mb-12">
        <p className="text-mono-eyebrow mb-3">Side-by-side</p>
        <h1 className="font-display text-4xl font-bold tracking-tighter md:text-5xl">Compare</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Shortlist up to four properties and compare price, trust, location, and campus access before you contact the owner.
        </p>
      </div>

      {ids.length === 0 ? (
        <EmptyCompare />
      ) : itemsQuery.isLoading ? (
        <div className="border border-border bg-surface p-16 text-center">
          <p className="text-mono-eyebrow">Loading selected properties</p>
        </div>
      ) : itemsQuery.isError ? (
        <div className="border border-border bg-surface p-16 text-center">
          <p className="text-mono-eyebrow mb-3">Could not load comparison</p>
          <button
            onClick={() => itemsQuery.refetch()}
            className="bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-80"
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <EmptyCompare />
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="w-44 p-4 text-left text-mono-eyebrow">Property</th>
                {items.map((property) => (
                  <th key={property.id} className="min-w-[260px] p-4 text-left align-top">
                    <div className="relative">
                      <button
                        onClick={() => toggle(property.id)}
                        aria-label="Remove"
                        className="absolute -right-1 -top-1 grid size-6 place-items-center border border-border bg-background hover:bg-surface-hi"
                      >
                        <X className="size-3" />
                      </button>
                      {property.image && (
                        <img
                          src={property.image}
                          alt={property.title}
                          className="mb-3 aspect-[4/3] w-full object-cover"
                        />
                      )}
                      <Link
                        to="/listing/$slug"
                        params={{ slug: property.slug }}
                        className="font-display text-lg transition-colors hover:text-accent"
                      >
                        {property.title}
                      </Link>
                      <p className="mt-1 text-xs font-mono text-muted-foreground">
                        {[property.locality, property.neighborhood, property.city].filter(Boolean).join(", ")}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {property.verified && (
                          <span className="inline-flex items-center gap-1 border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground">
                            <BadgeCheck className="size-3 text-accent" />
                            Verified listing
                          </span>
                        )}
                        {property.owner.verified && (
                          <span className="inline-flex items-center gap-1 border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground">
                            <BadgeCheck className="size-3 text-accent" />
                            Verified owner
                          </span>
                        )}
                        {property.primaryCollege && (
                          <span className="inline-flex items-center gap-1 border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground">
                            <GraduationCap className="size-3 text-accent" />
                            {property.primaryCollege.shortName}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground">
                          <Phone className="size-3 text-accent" />
                          {property.owner.responseRate}% response
                        </span>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-b border-border last:border-0">
                  <td className="p-4 align-top text-mono-eyebrow">{row.label}</td>
                  {items.map((property) => (
                    <td key={property.id} className="p-4 align-top">
                      {row.value(property)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="p-4 align-top text-mono-eyebrow">Amenities</td>
                {items.map((property) => (
                  <td key={property.id} className="p-4 align-top">
                    <ul className="space-y-1.5">
                      {property.amenities.slice(0, 6).map((amenity) => (
                        <li key={amenity} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="size-3 text-accent" />
                          {amenity}
                        </li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmptyCompare() {
  return (
    <div className="border border-border bg-surface p-16 text-center">
      <GitCompare className="mx-auto mb-4 size-8 text-muted-foreground" />
      <p className="text-mono-eyebrow mb-3">Nothing to compare</p>
      <h2 className="mb-3 font-display text-2xl">Add up to four properties.</h2>
      <p className="mx-auto mb-8 max-w-md text-sm text-muted-foreground">
        Use the compare icon on any listing to pin it here and check trust, campus distance, and pricing side by side.
      </p>
      <Link
        to="/explore"
        className="inline-block bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-80"
      >
        Explore properties
      </Link>
    </div>
  );
}
