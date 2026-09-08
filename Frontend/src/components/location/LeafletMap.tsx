import "leaflet/dist/leaflet.css";

import { Link } from "@tanstack/react-router";
import { Crosshair, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { formatCurrency } from "@/lib/currency";
import type { Property } from "@/lib/properties";
import { COLLEGES } from "@/lib/college-discovery";
import { cn } from "@/lib/utils";

type LocationValue = {
  country: string;
  state: string;
  city: string;
  locality: string;
  address: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
};

type GeocodeResult = LocationValue & {
  label: string;
};

type LeafletModule = typeof import("leaflet");
type LeafletMapInstance = ReturnType<LeafletModule["map"]>;
type LeafletMarkerInstance = ReturnType<LeafletModule["marker"]>;

const DEFAULT_CENTER: [number, number] = [30.3256, 78.0437];

function markerIcon(leaflet: LeafletModule) {
  return leaflet.divIcon({
    className: "",
    html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#111;border:3px solid white;box-shadow:0 6px 18px rgba(0,0,0,.35)"></span>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function activeMarkerIcon(leaflet: LeafletModule) {
  return leaflet.divIcon({
    className: "",
    html: '<span style="display:block;width:24px;height:24px;border-radius:9999px;background:#c9ff52;border:4px solid #111;box-shadow:0 8px 22px rgba(0,0,0,.4)"></span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function collegeMarkerIcon(leaflet: LeafletModule, shortName: string) {
  return leaflet.divIcon({
    className: "",
    html: `<div style="display:inline-flex;align-items:center;gap:3px;padding:3px 8px;border-radius:9999px;background:#1e1b4b;border:1.5px solid #818cf8;color:#fff;font-size:10px;font-weight:700;box-shadow:0 4px 12px rgba(0,0,0,0.35);white-space:nowrap;">🎓 ${shortName}</div>`,
    iconSize: [80, 22],
    iconAnchor: [40, 11],
  });
}

async function loadLeaflet() {
  return import("leaflet");
}

function initMap(leaflet: LeafletModule, container: HTMLDivElement, center: [number, number], zoom = 13) {
  const map = leaflet.map(container, { zoomControl: true, attributionControl: true }).setView(center, zoom);
  leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  return map;
}

function addressFromNominatim(item: any, lat: number, lon: number): GeocodeResult {
  const address = item.address ?? {};
  const locality = address.suburb ?? address.neighbourhood ?? address.quarter ?? address.village ?? address.town ?? "";
  const city = address.city ?? address.town ?? address.village ?? address.county ?? "";
  const state = address.state ?? "";
  const country = address.country ?? "";
  const road = [address.house_number, address.road].filter(Boolean).join(" ");
  const shortAddress = road || locality || item.name || item.display_name;
  return {
    label: item.display_name,
    country,
    state,
    city,
    locality,
    address: shortAddress,
    formattedAddress: item.display_name,
    latitude: lat,
    longitude: lon,
  };
}

export async function geocodeAddress(query: string): Promise<GeocodeResult[]> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`,
  );
  if (!response.ok) throw new Error("Address search failed");
  const items = await response.json();
  return items.map((item: any) => addressFromNominatim(item, Number(item.lat), Number(item.lon)));
}

async function reverseGeocode(lat: number, lon: number): Promise<GeocodeResult> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lon}`,
  );
  if (!response.ok) throw new Error("Location lookup failed");
  const item = await response.json();
  return addressFromNominatim(item, lat, lon);
}

export function LocationPicker({
  value,
  onChange,
}: {
  value?: Partial<LocationValue>;
  onChange: (location: LocationValue) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const mapRef = useRef<LeafletMapInstance | null>(null);
  const markerRef = useRef<LeafletMarkerInstance | null>(null);
  const [query, setQuery] = useState(value?.formattedAddress ?? "");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const searchRequestRef = useRef(0);
  const pointRequestRef = useRef(0);
  const selected = value?.latitude !== undefined && value.longitude !== undefined;

  const applyCoordinates = async (lat: number, lon: number, requestId: number) => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    if (leaflet && map) {
      markerRef.current?.remove();
      markerRef.current = leaflet.marker([lat, lon], { icon: activeMarkerIcon(leaflet) }).addTo(map);
      map.setView([lat, lon], 16);
    }

    try {
      const location = await reverseGeocode(lat, lon);
      if (requestId !== pointRequestRef.current) return;
      setQuery(location.formattedAddress);
      setLocationError(null);
      onChange(location);
    } catch {
      if (requestId !== pointRequestRef.current) return;
      const fallback = {
        country: value?.country ?? "",
        state: value?.state ?? "",
        city: value?.city ?? "",
        locality: value?.locality ?? "",
        address: value?.address ?? `${lat}, ${lon}`,
        formattedAddress: value?.formattedAddress ?? `${lat}, ${lon}`,
        latitude: lat,
        longitude: lon,
      };
      setQuery(fallback.formattedAddress);
      setLocationError("Coordinates found. Please confirm the address fields before continuing.");
      onChange(fallback);
    }
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    void loadLeaflet().then((leaflet) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = leaflet;
      const center: [number, number] = selected ? [value.latitude!, value.longitude!] : DEFAULT_CENTER;
      const map = initMap(leaflet, containerRef.current, center, selected ? 15 : 12);
      mapRef.current = map;

      if (selected) {
        markerRef.current = leaflet.marker(center, { icon: activeMarkerIcon(leaflet) }).addTo(map);
      }

      map.on("click", async (event) => {
        const requestId = ++pointRequestRef.current;
        const lat = Number(event.latlng.lat.toFixed(6));
        const lon = Number(event.latlng.lng.toFixed(6));
        await applyCoordinates(lat, lon, requestId);
      });
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const leaflet = leafletRef.current;
    if (!leaflet || !mapRef.current || !selected) return;
    const point: [number, number] = [value.latitude!, value.longitude!];
    markerRef.current?.remove();
    markerRef.current = leaflet.marker(point, { icon: activeMarkerIcon(leaflet) }).addTo(mapRef.current);
    mapRef.current.setView(point, 15);
  }, [selected, value?.latitude, value?.longitude]);

  const runSearch = async () => {
    if (query.trim().length < 3) return;
    const requestId = ++searchRequestRef.current;
    setSearching(true);
    try {
      const nextResults = await geocodeAddress(query.trim());
      if (requestId === searchRequestRef.current) setResults(nextResults);
    } finally {
      if (requestId === searchRequestRef.current) setSearching(false);
    }
  };

  const choose = (location: GeocodeResult) => {
    setResults([]);
    setQuery(location.formattedAddress);
    setLocationError(null);
    onChange(location);
  };

  const useCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("Current location is not supported by this browser.");
      return;
    }

    const requestId = ++pointRequestRef.current;
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lon = Number(position.coords.longitude.toFixed(6));
        void applyCoordinates(lat, lon, requestId).finally(() => {
          if (requestId === pointRequestRef.current) setLocating(false);
        });
      },
      (error) => {
        if (requestId !== pointRequestRef.current) return;
        setLocating(false);
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? "Allow location access in your browser, then try again."
            : "Could not fetch your current location. Try searching the address instead.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void runSearch();
            }
          }}
          placeholder="Search address, landmark, or area"
          className="w-full bg-background border border-border px-3 py-2.5 text-sm rounded-sm focus:outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={runSearch}
          disabled={searching}
          className="bg-foreground text-background px-4 py-2.5 text-xs font-bold uppercase tracking-widest rounded-sm disabled:opacity-50"
        >
          {searching ? "Searching" : "Search"}
        </button>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-4 py-2.5 text-xs font-bold uppercase tracking-widest rounded-sm disabled:opacity-50"
          aria-label="Use current location"
          title="Use current location"
        >
          {locating ? <LoaderCircle className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
          <span>{locating ? "Locating" : "Current location"}</span>
        </button>
      </div>
      {locationError && <p className="text-xs text-destructive">{locationError}</p>}
      {results.length > 0 && (
        <div className="border border-border bg-background divide-y divide-border">
          {results.map((result) => (
            <button
              key={`${result.latitude}-${result.longitude}-${result.label}`}
              type="button"
              onClick={() => choose(result)}
              className="w-full text-left p-3 text-sm hover:bg-surface-hi"
            >
              {result.label}
            </button>
          ))}
        </div>
      )}
      <div ref={containerRef} className="h-[320px] w-full overflow-hidden border border-border bg-surface" />
      <p className="text-xs text-muted-foreground">Search an address or tap the map to drop the exact property pin.</p>
    </div>
  );
}

export function PropertyLocationMap({
  latitude,
  longitude,
  title,
  className,
}: {
  latitude?: number | null;
  longitude?: number | null;
  title: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || latitude == null || longitude == null) return;
    let map: LeafletMapInstance | null = null;
    let cancelled = false;
    void loadLeaflet().then((leaflet) => {
      if (cancelled || !containerRef.current) return;
      map = initMap(leaflet, containerRef.current, [latitude, longitude], 15);
      leaflet.marker([latitude, longitude], { icon: activeMarkerIcon(leaflet) }).addTo(map).bindPopup(title);
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [latitude, longitude, title]);

  if (latitude == null || longitude == null) {
    return (
      <div className={cn("border border-border bg-surface p-6 text-sm text-muted-foreground", className)}>
        Exact map coordinates have not been added for this listing yet.
      </div>
    );
  }

  return <div ref={containerRef} className={cn("h-[340px] w-full overflow-hidden border border-border bg-surface", className)} />;
}

export function SearchMapView({ properties }: { properties: Property[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const mapRef = useRef<LeafletMapInstance | null>(null);
  const markerRefs = useRef<Map<string, LeafletMarkerInstance>>(new Map());
  const collegeMarkerRefs = useRef<LeafletMarkerInstance[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const mapped = useMemo(
    () => properties.filter((property) => property.latitude != null && property.longitude != null),
    [properties],
  );
  const active = properties.find((property) => property.id === activeId) ?? mapped[0];
  const mappedKey = useMemo(() => mapped.map((property) => property.id).join(","), [mapped]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    void loadLeaflet().then((leaflet) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = leaflet;
      mapRef.current = initMap(leaflet, containerRef.current, DEFAULT_CENTER, 11);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
      markerRefs.current.clear();
      collegeMarkerRefs.current = [];
    };
  }, []);

  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    if (!leaflet || !map) return;

    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current.clear();
    collegeMarkerRefs.current.forEach((marker) => marker.remove());
    collegeMarkerRefs.current = [];

    // 1. Plot College Campus Markers (Highest Z-Index)
    COLLEGES.forEach((college) => {
      if (college.latitude && college.longitude) {
        const marker = leaflet
          .marker([college.latitude, college.longitude], {
            icon: collegeMarkerIcon(leaflet, college.shortName),
            zIndexOffset: 1000,
          })
          .addTo(map);
        marker.bindPopup(`<div style="font-family:sans-serif;font-size:12px;padding:2px 4px;"><strong>🎓 ${college.name}</strong><div style="font-size:10px;color:#666;margin-top:2px;">${college.areaName}, Dehradun</div></div>`);
        collegeMarkerRefs.current.push(marker);
      }
    });

    // 2. Plot Property Markers
    mapped.forEach((property) => {
      const marker = leaflet
        .marker([property.latitude!, property.longitude!], {
          icon: markerIcon(leaflet),
        })
        .addTo(map);
      marker.on("click", () => setActiveId(property.id));
      markerRefs.current.set(property.id, marker);
    });

    if (mapped.length > 0) {
      const bounds = leaflet.latLngBounds(mapped.map((property) => [property.latitude!, property.longitude!]));
      map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
    }
  }, [mapped, mappedKey]);

  useEffect(() => {
    const leaflet = leafletRef.current;
    if (!leaflet) return;
    markerRefs.current.forEach((marker, id) => {
      marker.setIcon(id === activeId ? activeMarkerIcon(leaflet) : markerIcon(leaflet));
    });
  }, [activeId]);

  const highlight = (property: Property) => {
    setActiveId(property.id);
    mapRef.current?.setView([property.latitude!, property.longitude!], 15);
  };

  return (
    <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(360px,430px)_1fr]">
      <aside className="border-r border-border bg-background overflow-y-auto max-h-[45dvh] lg:max-h-[calc(100dvh-4rem)]">
        <div className="p-4 border-b border-border">
          <p className="text-mono-eyebrow mb-2">{mapped.length} mapped listings</p>
          <h1 className="font-display text-3xl tracking-tight">Search by map</h1>
        </div>
        <div className="divide-y divide-border">
          {properties.length === 0 && <p className="p-5 text-sm text-muted-foreground">No listings match this search yet.</p>}
          {properties.map((property) => (
            <button
              key={property.id}
              type="button"
              onClick={() => property.latitude != null && property.longitude != null && highlight(property)}
              className={cn("w-full text-left p-4 hover:bg-surface-hi transition-colors", active?.id === property.id && "bg-surface-hi")}
            >
              <p className="text-sm font-semibold">{property.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {[property.locality ?? property.neighborhood, property.city].filter(Boolean).join(", ")}
              </p>
              <p className="font-display text-lg font-bold mt-2">{formatCurrency(property.price)}</p>
            </button>
          ))}
        </div>
      </aside>
      <section className="relative min-h-[55dvh] lg:min-h-0">
        <div ref={containerRef} className="absolute inset-0 bg-surface" />
        {active && (
          <div className="absolute left-4 right-4 bottom-4 sm:left-auto sm:w-80 border border-border bg-background p-4 shadow-xl">
            <p className="text-sm font-semibold">{active.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{active.formattedAddress ?? active.address}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="font-display text-xl font-bold">{formatCurrency(active.price)}</span>
              <Link
                to="/listing/$slug"
                params={{ slug: active.slug }}
                className="bg-foreground text-background px-3 py-2 text-xs font-bold uppercase tracking-widest rounded-sm"
              >
                View
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
