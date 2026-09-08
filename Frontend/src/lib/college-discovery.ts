export type CollegeDirectoryItem = {
  slug: string;
  name: string;
  shortName: string;
  areaName: string;
  locality: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
};

export const COLLEGES: CollegeDirectoryItem[] = [
  {
    slug: "upes",
    name: "UPES",
    shortName: "UPES",
    areaName: "Bidholi",
    locality: "Bidholi",
    city: "Dehradun",
    state: "Uttarakhand",
    latitude: 30.4164,
    longitude: 77.9668,
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
    longitude: 78.0069,
  },
  {
    slug: "dit-university",
    name: "DIT University",
    shortName: "DIT",
    areaName: "Mussoorie Diversion",
    locality: "Makkawala",
    city: "Dehradun",
    state: "Uttarakhand",
    latitude: 30.3831,
    longitude: 78.0772,
  },
  {
    slug: "jbit",
    name: "JBIT",
    shortName: "JBIT",
    areaName: "Suddhowala",
    locality: "Suddhowala",
    city: "Dehradun",
    state: "Uttarakhand",
    latitude: 30.3441,
    longitude: 77.9351,
  },
  {
    slug: "bfit",
    name: "BFIT",
    shortName: "BFIT",
    areaName: "Suddhowala",
    locality: "Suddhowala",
    city: "Dehradun",
    state: "Uttarakhand",
    latitude: 30.3394,
    longitude: 77.9405,
  },
  {
    slug: "dbs",
    name: "DBS",
    shortName: "DBS",
    areaName: "Chakrata Road",
    locality: "Chakrata Road",
    city: "Dehradun",
    state: "Uttarakhand",
    latitude: 30.3242,
    longitude: 78.0416,
  },
  {
    slug: "tulas-institute",
    name: "Tula's Institute",
    shortName: "Tula's",
    areaName: "Selaqui",
    locality: "Selaqui",
    city: "Dehradun",
    state: "Uttarakhand",
    latitude: 30.3541,
    longitude: 77.8682,
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

