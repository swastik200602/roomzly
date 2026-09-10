/**
 * Open-Source Routing Machine (OSRM) integration for real-world
 * pedestrian street routing and accurate turn-by-turn road distance.
 */

export type WalkingRouteResult = {
  distanceKm: number;
  walkingMinutes: number;
  durationFormatted: string;
  distanceFormatted: string;
  coordinates: Array<[number, number]>; // Leaflet expects [lat, lng]
};

const routeCache = new Map<string, WalkingRouteResult>();

/**
 * Formats duration into human-friendly string (e.g. "~1h 30m" or "~14 min")
 */
export function formatWalkingDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMin = minutes % 60;
    return remainingMin > 0 ? `~${hours}h ${remainingMin}m` : `~${hours}h`;
  }
  return `~${minutes} min`;
}

/**
 * Fetches real turn-by-turn walking route from public OSRM API with caching.
 * Falls back to null if unreachable.
 */
export async function fetchWalkingRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<WalkingRouteResult | null> {
  const cacheKey = `${startLat.toFixed(4)},${startLng.toFixed(4)}->${endLat.toFixed(4)},${endLng.toFixed(4)}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const url = `https://router.project-osrm.org/route/v1/walking/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) return null;
    const data = await response.json();
    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) return null;

    const route = data.routes[0];
    const distanceMeters: number = route.distance;
    const durationSeconds: number = route.duration;

    const distanceKm = Number((distanceMeters / 1000).toFixed(distanceMeters < 1000 ? 2 : 1));
    // Walking pace from OSRM walking engine (roughly 4.5 km/h)
    const walkingMinutes = Math.max(1, Math.round(durationSeconds / 60));

    const distanceFormatted = distanceKm < 1 ? `${Math.round(distanceMeters)} m` : `${distanceKm} km`;
    const durationFormatted = formatWalkingDuration(walkingMinutes);

    // OSRM GeoJSON is [lng, lat], Leaflet wants [lat, lng]
    const coordinates: Array<[number, number]> = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    );

    const result: WalkingRouteResult = {
      distanceKm,
      walkingMinutes,
      durationFormatted,
      distanceFormatted,
      coordinates
    };

    routeCache.set(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}
