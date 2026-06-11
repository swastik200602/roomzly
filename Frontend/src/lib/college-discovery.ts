export type CollegeDirectoryItem = {
  slug: string;
  name: string;
  shortName: string;
  areaName: string;
  locality: string;
  city: string;
  state: string;
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
  },
  {
    slug: "graphic-era-university",
    name: "Graphic Era University",
    shortName: "Graphic Era",
    areaName: "Clement Town",
    locality: "Clement Town",
    city: "Dehradun",
    state: "Uttarakhand",
  },
  {
    slug: "dit-university",
    name: "DIT University",
    shortName: "DIT",
    areaName: "Mussoorie Diversion",
    locality: "Makkawala",
    city: "Dehradun",
    state: "Uttarakhand",
  },
  {
    slug: "jbit",
    name: "JBIT",
    shortName: "JBIT",
    areaName: "Suddhowala",
    locality: "Suddhowala",
    city: "Dehradun",
    state: "Uttarakhand",
  },
  {
    slug: "bfit",
    name: "BFIT",
    shortName: "BFIT",
    areaName: "Suddhowala",
    locality: "Suddhowala",
    city: "Dehradun",
    state: "Uttarakhand",
  },
  {
    slug: "dbs",
    name: "DBS",
    shortName: "DBS",
    areaName: "Chakrata Road",
    locality: "Chakrata Road",
    city: "Dehradun",
    state: "Uttarakhand",
  },
  {
    slug: "tulas-institute",
    name: "Tula's Institute",
    shortName: "Tula's",
    areaName: "Selaqui",
    locality: "Selaqui",
    city: "Dehradun",
    state: "Uttarakhand",
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

