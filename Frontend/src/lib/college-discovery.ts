export type CollegeDirectoryItem = {
  slug: string;
  name: string;
  shortName: string;
  areaName: string;
  locality: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
};

export const COLLEGES: CollegeDirectoryItem[] = [
  {
    slug: "upes",
    name: "UPES (Bidholi Campus)",
    shortName: "UPES",
    areaName: "Bidholi",
    locality: "Bidholi",
    city: "Dehradun",
    state: "Uttarakhand",
    latitude: 30.4164,
    longitude: 77.9668,
  },
  {
    slug: "upes-kandoli",
    name: "UPES (Kandoli Campus)",
    shortName: "UPES Kandoli",
    areaName: "Kandoli",
    locality: "Kandoli",
    city: "Dehradun",
    state: "Uttarakhand",
    latitude: 30.4035,
    longitude: 77.9712,
  },
  {
    slug: "graphic-era-university",
    name: "Graphic Era University",
    shortName: "Graphic Era",
    areaName: "Clement Town",
    locality: "Clement Town",
    city: "Dehradun",
    state: "Uttarakhand",
    latitude: 30.2685,
    longitude: 78.0132,
  },
  {
    slug: "dit-university",
    name: "DIT University",
    shortName: "DIT",
    areaName: "Mussoorie Diversion",
    locality: "Makkawala",
    city: "Dehradun",
    state: "Uttarakhand",
    latitude: 30.4008,
    longitude: 78.0716,
  },
  {
    slug: "uttaranchal-university",
    name: "Uttaranchal University",
    shortName: "Uttaranchal Univ",
    areaName: "Prem Nagar",
    locality: "Prem Nagar",
    city: "Dehradun",
    state: "Uttarakhand",
    latitude: 30.3392,
    longitude: 77.9540,
  },
  {
    slug: "jbit",
    name: "JBIT",
    shortName: "JBIT",
    areaName: "Suddhowala",
    locality: "Suddhowala",
    city: "Dehradun",
    state: "Uttarakhand",
    latitude: 30.3470,
    longitude: 77.9478,
  },
  {
    slug: "bfit",
    name: "BFIT",
    shortName: "BFIT",
    areaName: "Suddhowala",
    locality: "Suddhowala",
    city: "Dehradun",
    state: "Uttarakhand",
    latitude: 30.3417,
    longitude: 77.9437,
  },
  {
    slug: "dbs",
    name: "DBS",
    shortName: "DBS",
    areaName: "Chakrata Road",
    locality: "Chakrata Road",
    city: "Dehradun",
    state: "Uttarakhand",
    latitude: 30.3168,
    longitude: 78.0303,
  },
  {
    slug: "tulas-institute",
    name: "Tula's Institute",
    shortName: "Tula's",
    areaName: "Selaqui",
    locality: "Selaqui",
    city: "Dehradun",
    state: "Uttarakhand",
    latitude: 30.3815,
    longitude: 77.8823,
  },
];

export const STUDENT_AREAS = [
  { label: "Prem Nagar", search: { city: "Dehradun", locality: "Prem Nagar", cat: "pg" } },
  { label: "Clement Town", search: { city: "Dehradun", locality: "Clement Town" } },
  { label: "Suddhowala", search: { city: "Dehradun", locality: "Suddhowala" } },
  { label: "Bidholi", search: { city: "Dehradun", locality: "Bidholi" } },
  { label: "Selaqui", search: { city: "Dehradun", locality: "Selaqui" } },
];

export function collegeBySlug(slug?: string | null) {
  if (!slug) return undefined;
  return COLLEGES.find((college) => college.slug === slug);
}

/**
 * Calculates geodesic straight-line distance using the Haversine formula (Earth radius: 6371 km).
 */
export function calculateHaversineDistance(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRadians = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRadians(bLat - aLat);
  const dLng = toRadians(bLng - aLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(aLat)) * Math.cos(toRadians(bLat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Number(distance.toFixed(distance < 1 ? 2 : 1));
}

/**
 * Estimates walking travel duration based on average mountain/city walking speed.
 */
export function calculateWalkingMinutes(distanceKm: number): number {
  return Math.max(distanceKm < 0.4 ? 4 : 6, Math.round(distanceKm * 12));
}

/**
 * User-friendly distance display format with meter breakdown for close properties.
 */
export function formatCampusDistance(distanceKm?: number | null): string {
  if (distanceKm == null || isNaN(distanceKm)) return "";
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${distanceKm} km (${meters} m)`;
  }
  return `${distanceKm} km`;
}

