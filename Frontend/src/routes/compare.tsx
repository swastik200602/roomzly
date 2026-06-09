import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, GitCompare, X } from "lucide-react";

import { propertiesApi } from "@/lib/api/properties";
import type { Property } from "@/lib/properties";
import { useCompare } from "@/stores/compare";
import { formatCurrency } from "@/lib/currency";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare properties - Roomzly" },
      { name: "description", content: "Side-by-side comparison of up to 4 properties." },
    ],
  }),
  component: ComparePage,
});

const ROWS = [
  ["Price", (p: Property) => `${formatCurrency(p.price)} / mo`],
  ["Beds", (p: Property) => p.beds],
  ["Baths", (p: Property) => p.baths],
  ["Area", (p: Property) => `${p.sqft.toLocaleString()} sqft`],
  ["Furnishing", (p: Property) => p.furnishing],
  ["Rating", (p: Property) => `${p.rating} (${p.reviews})`],
  ["Verified", (p: Property) => (p.verified ? "yes" : "no")],
] as const;

function ComparePage() {
  const ids = useCompare((s) => s.ids);
  const toggle = useCompare((s) => s.toggle);
  const itemsQuery = useQuery({
    queryKey: ["properties", "compare", ids],
    queryFn: () => propertiesApi.batch(ids),
    enabled: ids.length > 0,
  });
  const items = itemsQuery.data ?? [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 animate-fade-in">
      <div className="mb-12">
        <p className="text-mono-eyebrow mb-3">Side-by-side</p>
        <h1 className="font-display text-4xl md:text-5xl tracking-tighter font-bold">
          Compare
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {items.length} / 4 selected
        </p>
      </div>

      {ids.length === 0 ? (
        <EmptyCompare />
      ) : itemsQuery.isLoading ? (
        <div className="border border-border p-16 text-center bg-surface">
          <p className="text-mono-eyebrow">Loading selected properties</p>
        </div>
      ) : itemsQuery.isError ? (
        <div className="border border-border p-16 text-center bg-surface">
          <p className="text-mono-eyebrow mb-3">Could not load comparison</p>
          <button
            onClick={() => itemsQuery.refetch()}
            className="bg-foreground text-background px-5 py-2.5 text-sm font-semibold rounded-sm inline-block hover:opacity-80 transition-opacity"
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
                <th className="text-left p-4 text-mono-eyebrow w-40">Property</th>
                {items.map((p) => (
                  <th key={p.id} className="text-left p-4 align-top min-w-[220px]">
                    <div className="relative">
                      <button
                        onClick={() => toggle(p.id)}
                        aria-label="Remove"
                        className="absolute -top-1 -right-1 size-6 grid place-items-center bg-background border border-border rounded-sm hover:bg-surface-hi"
                      >
                        <X className="size-3" />
                      </button>
                      {p.image && (
                        <img
                          src={p.image}
                          alt={p.title}
                          className="aspect-[4/3] w-full object-cover mb-3"
                        />
                      )}
                      <Link
                        to="/listing/$slug"
                        params={{ slug: p.slug }}
                        className="font-display text-lg hover:text-accent transition-colors"
                      >
                        {p.title}
                      </Link>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        {p.city}
                      </p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, val]) => (
                <tr key={label} className="border-b border-border last:border-0">
                  <td className="p-4 text-mono-eyebrow align-top">{label}</td>
                  {items.map((p) => (
                    <td key={p.id} className="p-4 align-top">
                      {String(val(p))}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="p-4 text-mono-eyebrow align-top">Amenities</td>
                {items.map((p) => (
                  <td key={p.id} className="p-4 align-top">
                    <ul className="space-y-1.5">
                      {p.amenities.slice(0, 6).map((a) => (
                        <li
                          key={a}
                          className="text-xs flex items-center gap-2 text-muted-foreground"
                        >
                          <Check className="size-3 text-accent" />
                          {a}
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
    <div className="border border-border p-16 text-center bg-surface">
      <GitCompare className="size-8 mx-auto text-muted-foreground mb-4" />
      <p className="text-mono-eyebrow mb-3">Nothing to compare</p>
      <h2 className="font-display text-2xl mb-3">Add up to four properties.</h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
        Use the compare icon on any listing to pin it here.
      </p>
      <Link
        to="/explore"
        className="bg-foreground text-background px-5 py-2.5 text-sm font-semibold rounded-sm inline-block hover:opacity-80 transition-opacity"
      >
        Explore properties
      </Link>
    </div>
  );
}
