import { Suspense, lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { propertiesApi } from "@/lib/api/properties";

const SearchMapView = lazy(() => import("@/components/location/LeafletMap").then((module) => ({ default: module.SearchMapView })));

export const Route = createFileRoute("/search-map")({
  head: () => ({ meta: [{ title: "Search Map - Roomzly" }, { name: "description", content: "Explore Roomzly properties on an interactive OpenStreetMap map." }] }),
  component: SearchMapPage,
});

function SearchMapPage() {
  const propertiesQuery = useQuery({
    queryKey: ["properties", "search-map"],
    queryFn: () => propertiesApi.list({ limit: 50 }),
  });

  if (propertiesQuery.isLoading) {
    return (
      <div className="min-h-[70dvh] grid place-items-center">
        <p className="text-mono-eyebrow">Loading map listings</p>
      </div>
    );
  }

  if (propertiesQuery.isError) {
    return (
      <div className="min-h-[70dvh] grid place-items-center text-center px-6">
        <div>
          <p className="text-mono-eyebrow mb-3">Map unavailable</p>
          <h1 className="font-display text-4xl tracking-tight mb-6">Could not load mapped listings.</h1>
          <button
            type="button"
            onClick={() => propertiesQuery.refetch()}
            className="bg-foreground text-background px-5 py-2.5 text-sm font-semibold rounded-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-[70dvh] grid place-items-center">
          <p className="text-mono-eyebrow">Loading map...</p>
        </div>
      }
    >
      <SearchMapView properties={propertiesQuery.data?.data ?? []} />
    </Suspense>
  );
}
