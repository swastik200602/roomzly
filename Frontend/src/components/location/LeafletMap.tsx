import "leaflet/dist/leaflet.css";

import { Link } from "@tanstack/react-router";
import { ArrowRight, Crosshair, GraduationCap, LayoutGrid, LoaderCircle, MapPin, Navigation, Search, ShieldCheck, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ProgressiveImage } from "@/components/property/ProgressiveImage";
import { COLLEGES, calculateHaversineDistance, calculateWalkingMinutes } from "@/lib/college-discovery";
import { formatCurrency } from "@/lib/currency";
import type { Property, PropertyCollegeMatch } from "@/lib/properties";
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

function createSimplePinIcon(leaflet: LeafletModule, active = false) {
  const width = active ? 36 : 28;
  const height = active ? 46 : 38;
  const pinBg = active ? "#2563eb" : "#0f172a";
  const stroke = "#ffffff";
  const strokeWidth = active ? "2.5" : "2";
  const dotColor = active ? "#ffffff" : "#38bdf8";

  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
      <svg width="${width}" height="${height}" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 4px 10px rgba(0,0,0,0.5));">
        <path d="M16 39C16 39 30.5 25 30.5 15.5C30.5 7.49187 24.0081 1 16 1C7.99187 1 1.5 7.49187 1.5 15.5C1.5 25 16 39 16 39Z" fill="${pinBg}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>
        <circle cx="16" cy="15.5" r="7" fill="#ffffff"/>
        <circle cx="16" cy="15.5" r="3.8" fill="${dotColor}"/>
      </svg>
    </div>
  `;

  return leaflet.divIcon({
    className: "roomzly-pin-marker",
    html,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height],
  });
}

function createPropertyPinIcon(leaflet: LeafletModule, property: Property, isActive = false) {
  const width = isActive ? 34 : 28;
  const height = isActive ? 44 : 36;
  const pinBg = isActive ? "#2563eb" : "#0f172a";
  const stroke = isActive ? "#ffffff" : "#f1f5f9";
  const strokeWidth = isActive ? "2.5" : "2";
  const iconFill = isActive ? "#2563eb" : "#38bdf8";
  const innerCircleFill = isActive ? "#ffffff" : "#1e293b";

  const shortPrice =
    property.price >= 1000
      ? `₹${(property.price / 1000).toFixed(property.price % 1000 === 0 ? 0 : 1)}k`
      : `₹${property.price}`;

  const html = `
    <div class="roomzly-pin-wrapper" style="display:flex;flex-direction:column;align-items:center;cursor:pointer;user-select:none;transform:translate3d(0,0,0);">
      <div style="background:${isActive ? '#2563eb' : 'rgba(15, 23, 42, 0.95)'};color:#ffffff;font-size:${isActive ? '11px' : '10px'};font-weight:700;font-family:system-ui,-apple-system,sans-serif;padding:2px 7px;border-radius:9999px;border:1.5px solid ${isActive ? '#ffffff' : 'rgba(255,255,255,0.45)'};box-shadow:0 4px 10px rgba(0,0,0,0.45);white-space:nowrap;margin-bottom:2px;letter-spacing:0.02em;">
        ${shortPrice}
      </div>
      <svg width="${width}" height="${height - 10}" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 4px 8px rgba(0,0,0,0.5));">
        <path d="M16 39C16 39 30.5 25 30.5 15.5C30.5 7.49187 24.0081 1 16 1C7.99187 1 1.5 7.49187 1.5 15.5C1.5 25 16 39 16 39Z" fill="${pinBg}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>
        <circle cx="16" cy="15.5" r="7.5" fill="${innerCircleFill}"/>
        <path d="M12 18V16L16 12.5L20 16V18H12Z" fill="${iconFill}"/>
        <rect x="14.5" y="15.5" width="3" height="2.5" fill="${innerCircleFill}"/>
      </svg>
    </div>
  `;

  return leaflet.divIcon({
    className: "roomzly-pin-marker",
    html,
    iconSize: [80, height + 16],
    iconAnchor: [40, height + 14],
    popupAnchor: [0, -(height + 14)],
  });
}

function createCollegePinIcon(leaflet: LeafletModule, collegeName: string) {
  const html = `
    <div class="roomzly-college-pin" style="display:flex;flex-direction:column;align-items:center;cursor:pointer;user-select:none;transform:translate3d(0,0,0);">
      <div style="background:#059669;color:#ffffff;font-size:10px;font-weight:700;font-family:system-ui,-apple-system,sans-serif;padding:2px 8px;border-radius:9999px;border:1.5px solid #ffffff;box-shadow:0 4px 10px rgba(0,0,0,0.45);white-space:nowrap;margin-bottom:2px;display:flex;align-items:center;gap:4px;">
        <span>🎓</span>
        <span>${collegeName}</span>
      </div>
      <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.4));">
        <path d="M12 31C12 31 22 19 22 11C22 5.47715 17.5228 1 12 1C6.47715 1 2 5.47715 2 11C2 19 12 31 12 31Z" fill="#059669" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="12" cy="11" r="5" fill="#ffffff"/>
        <circle cx="12" cy="11" r="2.5" fill="#059669"/>
      </svg>
    </div>
  `;

  return leaflet.divIcon({
    className: "roomzly-college-marker",
    html,
    iconSize: [120, 52],
    iconAnchor: [60, 50],
    popupAnchor: [0, -50],
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
      markerRef.current = leaflet.marker([lat, lon], { icon: createSimplePinIcon(leaflet, true) }).addTo(map);
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
        markerRef.current = leaflet.marker(center, { icon: createSimplePinIcon(leaflet, true) }).addTo(map);
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
    markerRef.current = leaflet.marker(point, { icon: createSimplePinIcon(leaflet, true) }).addTo(mapRef.current);
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
  primaryCollege,
  className,
}: {
  latitude?: number | null;
  longitude?: number | null;
  title: string;
  primaryCollege?: PropertyCollegeMatch | null;
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
      leaflet
        .marker([latitude, longitude], { icon: createSimplePinIcon(leaflet, true) })
        .addTo(map)
        .bindPopup(`<strong>${title}</strong><br/><span style="font-size:11px;color:#64748b;">Property Location</span>`);

      if (primaryCollege?.latitude != null && primaryCollege?.longitude != null) {
        const cLat = primaryCollege.latitude;
        const cLng = primaryCollege.longitude;
        const collegeMarker = leaflet
          .marker([cLat, cLng], {
            icon: createCollegePinIcon(leaflet, primaryCollege.shortName),
            zIndexOffset: 300,
          })
          .addTo(map);

        const distStr =
          primaryCollege.distanceKm < 1
            ? `${Math.round(primaryCollege.distanceKm * 1000)} m (${primaryCollege.distanceKm} km)`
            : `${primaryCollege.distanceKm} km`;

        collegeMarker.bindPopup(
          `<div style="font-family:system-ui,-apple-system,sans-serif;padding:2px 4px;">` +
            `<div style="font-weight:700;font-size:13px;color:#0f172a;">🎓 ${primaryCollege.name || primaryCollege.shortName}</div>` +
            `<div style="font-size:11px;color:#059669;font-weight:600;margin-top:2px;">${distStr} to property</div>` +
            `<div style="font-size:11px;color:#64748b;">~${primaryCollege.walkingMinutes} min walk</div>` +
          `</div>`,
        );

        const polyline = leaflet
          .polyline(
            [
              [latitude, longitude],
              [cLat, cLng],
            ],
            {
              color: "#2563eb",
              weight: 3,
              dashArray: "6, 8",
              opacity: 0.85,
            },
          )
          .addTo(map);

        polyline.bindTooltip(
          `🎓 ${primaryCollege.shortName}: ${distStr} • ~${primaryCollege.walkingMinutes} min walk`,
          {
            permanent: true,
            direction: "center",
            className: "roomzly-distance-tooltip",
          },
        );

        const bounds = leaflet.latLngBounds([
          [latitude, longitude],
          [cLat, cLng],
        ]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [latitude, longitude, title, primaryCollege]);

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
  const polylineRef = useRef<any>(null);
  const routeBadgeMarkerRef = useRef<LeafletMarkerInstance | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isCardDismissed, setIsCardDismissed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollegeSlug, setSelectedCollegeSlug] = useState<string>("all");
  const [mobileTab, setMobileTab] = useState<"map" | "list">("map");

  const getClosestCollege = (propLat: number, propLng: number) => {
    let minDistance = Infinity;
    let closest = COLLEGES[0];
    for (const c of COLLEGES) {
      const d = calculateHaversineDistance(propLat, propLng, c.latitude, c.longitude);
      if (d < minDistance) {
        minDistance = d;
        closest = c;
      }
    }
    return { college: closest, distanceKm: minDistance };
  };

  const mapped = useMemo(
    () => properties.filter((property) => property.latitude != null && property.longitude != null),
    [properties],
  );

  const filteredMapped = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = mapped.filter((p) => {
      const matchesCat = selectedCat === "all" || p.category === selectedCat;
      const matchesQ =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.locality && p.locality.toLowerCase().includes(q)) ||
        (p.neighborhood && p.neighborhood.toLowerCase().includes(q)) ||
        p.city.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });

    const targetCollege = selectedCollegeSlug !== "all"
      ? COLLEGES.find((c) => c.slug === selectedCollegeSlug)
      : null;

    const enriched = list.map((p) => {
      const college = targetCollege ?? getClosestCollege(p.latitude!, p.longitude!).college;
      const distanceKm = calculateHaversineDistance(p.latitude!, p.longitude!, college.latitude, college.longitude);
      const walkingMinutes = calculateWalkingMinutes(distanceKm);
      const distanceStr = distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm} km`;
      return {
        ...p,
        targetCollege: college,
        distanceKm,
        walkingMinutes,
        distanceStr,
      };
    });

    if (selectedCollegeSlug !== "all") {
      enriched.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return enriched;
  }, [mapped, selectedCat, searchQuery, selectedCollegeSlug]);

  const active = filteredMapped.find((property) => property.id === activeId) ?? filteredMapped[0] ?? mapped[0];
  const mappedKey = useMemo(() => filteredMapped.map((property) => property.id).join(","), [filteredMapped]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    void loadLeaflet().then((leaflet) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = leaflet;
      mapRef.current = initMap(leaflet, containerRef.current, DEFAULT_CENTER, 11);
      setIsMapReady(true);
    });

    return () => {
      cancelled = true;
      polylineRef.current?.remove();
      routeBadgeMarkerRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
      markerRefs.current.clear();
      collegeMarkerRefs.current = [];
      setIsMapReady(false);
    };
  }, []);

  // Ensure map tiles resize correctly when mobileTab changes
  useEffect(() => {
    if (mobileTab === "map" && mapRef.current) {
      const timer = setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [mobileTab]);

  // College Landmark Markers
  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    if (!leaflet || !map || !isMapReady) return;

    collegeMarkerRefs.current.forEach((m) => m.remove());
    collegeMarkerRefs.current = [];

    COLLEGES.forEach((college) => {
      const isSelected = selectedCollegeSlug === college.slug;
      const marker = leaflet
        .marker([college.latitude, college.longitude], {
          icon: createCollegePinIcon(leaflet, college.shortName),
          zIndexOffset: isSelected ? 400 : 250,
        })
        .addTo(map);

      marker.bindPopup(
        `<div style="font-family:system-ui,-apple-system,sans-serif;padding:2px 4px;">` +
          `<div style="font-weight:700;font-size:13px;color:#0f172a;">🎓 ${college.name}</div>` +
          `<div style="font-size:11px;color:#64748b;margin-top:2px;">${college.locality}, ${college.city}</div>` +
          `<div style="font-size:10px;color:#059669;font-weight:700;margin-top:4px;text-transform:uppercase;letter-spacing:0.04em;">Campus Landmark</div>` +
        `</div>`,
      );

      marker.on("click", () => {
        setSelectedCollegeSlug(college.slug);
      });

      collegeMarkerRefs.current.push(marker);
    });

    return () => {
      collegeMarkerRefs.current.forEach((m) => m.remove());
      collegeMarkerRefs.current = [];
    };
  }, [isMapReady, selectedCollegeSlug]);

  // Property Markers
  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    if (!leaflet || !map || !isMapReady) return;

    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current.clear();

    const currentActiveId = active?.id ?? filteredMapped[0]?.id;

    filteredMapped.forEach((property) => {
      const isSelected = property.id === currentActiveId;
      const marker = leaflet
        .marker([property.latitude!, property.longitude!], {
          icon: createPropertyPinIcon(leaflet, property, isSelected),
          zIndexOffset: isSelected ? 1000 : 0,
        })
        .addTo(map);

      marker.on("click", () => {
        setActiveId(property.id);
        setIsCardDismissed(false);
      });
      markerRefs.current.set(property.id, marker);
    });

    if (filteredMapped.length > 0 && selectedCollegeSlug === "all") {
      const bounds = leaflet.latLngBounds(filteredMapped.map((property) => [property.latitude!, property.longitude!]));
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
    }
  }, [isMapReady, filteredMapped, mappedKey]);

  // Marker icon update on active change
  useEffect(() => {
    const leaflet = leafletRef.current;
    if (!leaflet) return;
    const currentActiveId = active?.id ?? filteredMapped[0]?.id;
    markerRefs.current.forEach((marker, id) => {
      const prop = filteredMapped.find((p) => p.id === id);
      if (prop) {
        const isSelected = id === currentActiveId;
        marker.setIcon(createPropertyPinIcon(leaflet, prop, isSelected));
        marker.setZIndexOffset(isSelected ? 1000 : 0);
      }
    });
  }, [active?.id, filteredMapped]);

  // Interactive Walking Polyline between Active Property and College
  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    if (!leaflet || !map || !isMapReady || !active || active.latitude == null || active.longitude == null) {
      polylineRef.current?.remove();
      polylineRef.current = null;
      routeBadgeMarkerRef.current?.remove();
      routeBadgeMarkerRef.current = null;
      return;
    }

    polylineRef.current?.remove();
    polylineRef.current = null;
    routeBadgeMarkerRef.current?.remove();
    routeBadgeMarkerRef.current = null;

    const targetCollege = selectedCollegeSlug !== "all"
      ? COLLEGES.find((c) => c.slug === selectedCollegeSlug)
      : (active as any).targetCollege ?? getClosestCollege(active.latitude, active.longitude).college;

    if (!targetCollege) return;

    const distKm = calculateHaversineDistance(active.latitude, active.longitude, targetCollege.latitude, targetCollege.longitude);
    const walkMin = calculateWalkingMinutes(distKm);
    const distStr = distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm} km`;

    // Draw dashed walking polyline
    const polyline = (leaflet as any).polyline(
      [
        [active.latitude, active.longitude],
        [targetCollege.latitude, targetCollege.longitude],
      ],
      {
        color: "#2563eb",
        weight: 3.5,
        dashArray: "6, 8",
        opacity: 0.9,
      },
    ).addTo(map);

    polylineRef.current = polyline;

    // Midpoint walking badge marker
    const midLat = (active.latitude + targetCollege.latitude) / 2;
    const midLng = (active.longitude + targetCollege.longitude) / 2;

    const badgeHtml = `
      <div style="background:#0f172a;color:#ffffff;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:700;display:inline-flex;align-items:center;gap:4px;box-shadow:0 4px 12px rgba(0,0,0,0.35);border:1px solid #3b82f6;white-space:nowrap;transform:translate(-50%, -50%);font-family:system-ui,-apple-system,sans-serif;">
        <span>🚶 ${distStr}</span>
        <span style="color:#93c5fd;font-weight:500;">(~${walkMin}m)</span>
      </div>
    `;

    const badgeMarker = leaflet.marker([midLat, midLng], {
      icon: leaflet.divIcon({
        className: "walking-route-badge",
        html: badgeHtml,
        iconSize: [110, 24],
        iconAnchor: [55, 12],
      }),
      zIndexOffset: 950,
    }).addTo(map);

    routeBadgeMarkerRef.current = badgeMarker;

    return () => {
      polyline.remove();
      badgeMarker.remove();
    };
  }, [active?.id, active?.latitude, active?.longitude, selectedCollegeSlug, isMapReady]);

  const highlight = (property: Property) => {
    setActiveId(property.id);
    setIsCardDismissed(false);
    if (property.latitude != null && property.longitude != null && mapRef.current) {
      mapRef.current.setView([property.latitude, property.longitude], 15, {
        animate: true,
      });
    }
  };

  const handleCollegeChange = (slug: string) => {
    setSelectedCollegeSlug(slug);
    if (!mapRef.current || !leafletRef.current) return;
    if (slug === "all") {
      if (filteredMapped.length > 0) {
        const bounds = leafletRef.current.latLngBounds(
          filteredMapped.map((p) => [p.latitude!, p.longitude!]),
        );
        mapRef.current.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
      }
    } else {
      const college = COLLEGES.find((c) => c.slug === slug);
      if (college) {
        mapRef.current.setView([college.latitude, college.longitude], 14, { animate: true });
      }
    }
  };

  const activeMatch = active as any;

  return (
    <div className="relative min-h-[calc(100dvh-4rem)]">
      {/* Floating Mobile Toggle Pill (Airbnb/Zillow Style) */}
      <div className="lg:hidden fixed bottom-5 left-1/2 -translate-y-1/2 z-[1005] shadow-2xl pointer-events-auto">
        <button
          type="button"
          onClick={() => setMobileTab(mobileTab === "map" ? "list" : "map")}
          className="bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-2xl border border-white/20 dark:border-black/20 hover:scale-105 active:scale-95 transition-transform"
        >
          {mobileTab === "map" ? (
            <>
              <LayoutGrid className="size-3.5" />
              <span>Show List ({filteredMapped.length})</span>
            </>
          ) : (
            <>
              <MapPin className="size-3.5" />
              <span>Show Map</span>
            </>
          )}
        </button>
      </div>

      <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(360px,440px)_1fr]">
        {/* Sidebar */}
        <aside
          className={cn(
            "border-r border-border bg-background overflow-y-auto flex flex-col",
            "lg:max-h-[calc(100dvh-4rem)] lg:flex",
            mobileTab === "list" ? "flex min-h-[calc(100dvh-4rem)] pb-24" : "hidden",
          )}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-mono-eyebrow">{filteredMapped.length} mapped spaces</p>
                <h1 className="font-display text-2xl font-bold tracking-tight mt-0.5">Search by map</h1>
              </div>
              <Link
                to="/explore"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-border bg-surface hover:bg-surface-hi text-xs font-mono uppercase tracking-wider rounded-sm transition-colors text-muted-foreground hover:text-foreground"
              >
                <LayoutGrid className="size-3.5" />
                <span>Grid View</span>
              </Link>
            </div>

            {/* College Selector Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <GraduationCap className="size-3.5 text-accent" />
                <span>Filter near Campus</span>
              </label>
              <div className="relative">
                <select
                  value={selectedCollegeSlug}
                  onChange={(e) => handleCollegeChange(e.target.value)}
                  className="w-full bg-surface border border-border text-xs rounded-sm py-2 pl-3 pr-8 text-foreground focus:outline-none focus:border-accent font-medium cursor-pointer"
                >
                  <option value="all">🎓 All Dehradun Campuses</option>
                  {COLLEGES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      🎓 {c.name} ({c.locality || c.areaName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search locality or area..."
                className="w-full pl-8 pr-7 py-2 bg-surface border border-border text-xs rounded-sm focus:outline-none focus:border-accent text-foreground placeholder:text-muted-foreground/60"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              {[
                { id: "all", label: "All" },
                { id: "pg", label: "PG / Hostels" },
                { id: "apartment", label: "Apartments" },
                { id: "studio", label: "Studios" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCat(c.id)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors shrink-0",
                    selectedCat === c.id
                      ? "bg-foreground text-background border-foreground font-semibold"
                      : "bg-surface border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Listings List */}
          <div className="divide-y divide-border overflow-y-auto flex-1">
            {filteredMapped.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground space-y-2">
                <p>No listings match your map filter.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCat("all");
                    setSelectedCollegeSlug("all");
                  }}
                  className="text-xs text-accent underline font-semibold"
                >
                  Reset filters
                </button>
              </div>
            )}
            {filteredMapped.map((property) => (
              <button
                key={property.id}
                type="button"
                onClick={() => {
                  if (property.latitude != null && property.longitude != null) {
                    highlight(property);
                    setMobileTab("map");
                  }
                }}
                className={cn(
                  "w-full text-left p-3.5 hover:bg-surface-hi transition-colors flex items-center gap-3",
                  active?.id === property.id && "bg-surface-hi border-l-2 border-accent",
                )}
              >
                <div className="size-16 rounded-sm overflow-hidden border border-border shrink-0 bg-surface">
                  <ProgressiveImage
                    src={property.image || property.images?.[0]?.url || property.gallery?.[0] || ""}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono uppercase text-accent font-semibold">
                      {property.categoryLabel || property.category}
                    </span>
                    {property.verified && (
                      <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                        <ShieldCheck className="size-2.5 text-accent" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold truncate text-foreground mt-0.5">{property.title}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {[property.locality ?? property.neighborhood, property.city].filter(Boolean).join(", ")}
                  </p>

                  {/* College Proximity Badge */}
                  {property.targetCollege && (
                    <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                      <GraduationCap className="size-3 shrink-0" />
                      <span>{property.distanceStr} to {property.targetCollege.shortName} (~{property.walkingMinutes}m)</span>
                    </p>
                  )}

                  <p className="font-display text-sm font-bold text-foreground mt-1">
                    {formatCurrency(property.price)} <span className="text-[10px] font-normal text-muted-foreground">/mo</span>
                  </p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Map Section */}
        <section
          className={cn(
            "relative min-h-[calc(100dvh-4rem)] lg:min-h-0",
            mobileTab === "map" ? "block h-[calc(100dvh-4rem)]" : "hidden lg:block",
          )}
        >
          <div ref={containerRef} className="absolute inset-0 bg-surface" />

          {/* Mobile Top Controls Bar */}
          <div className="lg:hidden absolute top-3 left-3 right-3 z-[1001] flex items-center gap-2">
            <div className="flex-1 bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-lg px-3 py-2 flex items-center gap-2">
              <GraduationCap className="size-4 text-accent shrink-0" />
              <select
                value={selectedCollegeSlug}
                onChange={(e) => handleCollegeChange(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer truncate"
              >
                <option value="all">🎓 All Dehradun Campuses</option>
                {COLLEGES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    🎓 {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Desktop Selected Campus Floating Tag */}
          {selectedCollegeSlug !== "all" && (
            <div className="hidden lg:flex absolute top-4 left-4 z-[1001] bg-background/90 backdrop-blur-md border border-border px-3 py-1.5 rounded-full shadow-lg items-center gap-2 text-xs font-semibold">
              <span className="size-2 rounded-full bg-accent animate-pulse" />
              <span>Campus: {COLLEGES.find((c) => c.slug === selectedCollegeSlug)?.name}</span>
              <button
                type="button"
                onClick={() => handleCollegeChange("all")}
                className="text-muted-foreground hover:text-foreground text-xs ml-1 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Active Property Card — Compact horizontal layout on mobile so it never covers the map */}
          {active && !isCardDismissed && (
            <div className="absolute bottom-20 lg:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-92 md:w-96 z-[1001] pointer-events-auto">
              <div className="relative border border-border bg-card/95 backdrop-blur-md shadow-2xl rounded-xl overflow-hidden flex flex-row gap-3 p-2.5 sm:p-3 text-foreground items-center">
                <button
                  type="button"
                  onClick={() => setIsCardDismissed(true)}
                  className="absolute top-2 right-2 z-20 size-6 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground grid place-items-center transition-colors shadow-sm"
                  aria-label="Close card"
                >
                  <X className="size-3.5" />
                </button>

                <div className="relative size-20 sm:size-24 rounded-lg overflow-hidden border border-border/60 shrink-0 bg-surface">
                  <ProgressiveImage
                    src={active.image || active.images?.[0]?.url || active.gallery?.[0] || ""}
                    alt={active.title}
                    className="w-full h-full object-cover"
                  />
                  {active.verified && (
                    <span className="absolute bottom-1 left-1 bg-accent text-accent-foreground text-[8px] font-bold px-1.5 py-0.5 rounded-[2px] flex items-center gap-0.5 shadow-sm">
                      <ShieldCheck className="size-2" /> Verified
                    </span>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between min-w-0 pr-6">
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-accent font-semibold">
                      {active.categoryLabel || active.category}
                    </span>
                    <p className="text-xs sm:text-sm font-semibold truncate text-foreground mt-0.5" title={active.title}>
                      {active.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="size-2.5 shrink-0" />
                      <span>{[active.locality ?? active.neighborhood, active.city].filter(Boolean).join(", ")}</span>
                    </p>

                    {/* Proximity / Walking Distance badge */}
                    {activeMatch?.targetCollege && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
                        <GraduationCap className="size-3 shrink-0" />
                        <span>{activeMatch.distanceStr} to {activeMatch.targetCollege.shortName} (~{activeMatch.walkingMinutes}m)</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-1.5 pt-1.5 border-t border-border/60 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-display text-sm sm:text-base font-bold text-foreground">
                        {formatCurrency(active.price)}
                      </span>
                      <span className="text-[9px] text-muted-foreground ml-0.5">/mo</span>
                    </div>
                    <Link
                      to="/listing/$slug"
                      params={{ slug: active.slug }}
                      className="inline-flex items-center gap-1 bg-foreground text-background hover:bg-accent hover:text-accent-foreground px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-sm transition-colors shrink-0"
                    >
                      <span>View</span>
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
