import { PropertyCategory } from "@prisma/client";

export type CollegeRecord = {
  slug: string;
  name: string;
  shortName: string;
  city: string;
  state: string;
  areaName: string;
  locality: string;
  latitude: number;
  longitude: number;
  searchRadiusKm: number;
  aliases: string[];
};

export type PropertyCollegeMatch = {
  collegeSlug: string;
  collegeName: string;
  shortName: string;
  areaName: string;
  locality: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  walkingMinutes: number;
  drivingMinutes: number;
  studentFriendlyScore: number;
  popularAmongStudents: boolean;
  verifiedNearCampus: boolean;
};

type PropertyCollegeInput = {
  latitude?: number | null;
  longitude?: number | null;
  category: PropertyCategory;
  amenities: string[];
  price: number;
  verified: boolean;
  viewCount: number;
  reviewCount: number;
  ownerPhoneVerified: boolean;
};

export const colleges: CollegeRecord[] = [
  {
    slug: "upes",
    name: "UPES",
    shortName: "UPES",
    city: "Dehradun",
    state: "Uttarakhand",
    areaName: "Bidholi",
    locality: "Bidholi",
    latitude: 30.4164,
    longitude: 77.9668,
    searchRadiusKm: 6,
    aliases: ["upes", "university of petroleum and energy studies", "bidholi campus"],
  },
  {
    slug: "graphic-era-university",
    name: "Graphic Era University",
    shortName: "Graphic Era",
    city: "Dehradun",
    state: "Uttarakhand",
    areaName: "Clement Town",
    locality: "Clement Town",
    latitude: 30.2685,
    longitude: 78.0132,
    searchRadiusKm: 5,
    aliases: ["graphic era", "geu", "graphic era university", "graphic era dehradun"],
  },
  {
    slug: "dit-university",
    name: "DIT University",
    shortName: "DIT",
    city: "Dehradun",
    state: "Uttarakhand",
    areaName: "Mussoorie Diversion",
    locality: "Makkawala",
    latitude: 30.4008,
    longitude: 78.0716,
    searchRadiusKm: 5,
    aliases: ["dit", "dit university", "dehradun institute of technology"],
  },
  {
    slug: "uttaranchal-university",
    name: "Uttaranchal University",
    shortName: "Uttaranchal Univ",
    city: "Dehradun",
    state: "Uttarakhand",
    areaName: "Prem Nagar",
    locality: "Prem Nagar",
    latitude: 30.3392,
    longitude: 77.9540,
    searchRadiusKm: 5,
    aliases: ["uttaranchal", "uttaranchal university", "uu", "prem nagar campus"],
  },
  {
    slug: "upes-kandoli",
    name: "UPES (Kandoli Campus)",
    shortName: "UPES Kandoli",
    city: "Dehradun",
    state: "Uttarakhand",
    areaName: "Kandoli",
    locality: "Kandoli",
    latitude: 30.4035,
    longitude: 77.9712,
    searchRadiusKm: 5,
    aliases: ["kandoli", "upes kandoli", "school of law", "school of design"],
  },
  {
    slug: "jbit",
    name: "JBIT (JB Institute of Technology)",
    shortName: "JBIT",
    city: "Dehradun",
    state: "Uttarakhand",
    areaName: "Shankarpur",
    locality: "Shankarpur",
    latitude: 30.3788,
    longitude: 77.8248,
    searchRadiusKm: 6,
    aliases: ["jbit", "jb institute of technology", "jbit dehradun", "shankarpur"],
  },
  {
    slug: "bfit",
    name: "BFIT",
    shortName: "BFIT",
    city: "Dehradun",
    state: "Uttarakhand",
    areaName: "Suddhowala",
    locality: "Suddhowala",
    latitude: 30.3417,
    longitude: 77.9437,
    searchRadiusKm: 4.5,
    aliases: ["bfit", "baba farid institute of technology", "bfit dehradun"],
  },
  {
    slug: "dbs",
    name: "Doon Business School (DBS)",
    shortName: "DBS",
    city: "Dehradun",
    state: "Uttarakhand",
    areaName: "Selaqui",
    locality: "Selaqui",
    latitude: 30.3682,
    longitude: 77.8653,
    searchRadiusKm: 5,
    aliases: ["dbs", "doon business school", "dbs dehradun", "selaqui campus"],
  },
  {
    slug: "tulas-institute",
    name: "Tula's Institute",
    shortName: "Tula's",
    city: "Dehradun",
    state: "Uttarakhand",
    areaName: "Dhoolkot",
    locality: "Selaqui",
    latitude: 30.3606,
    longitude: 77.8765,
    searchRadiusKm: 5,
    aliases: ["tulas", "tula's", "tulas institute", "tula's institute"],
  },
];

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function findCollegeBySlug(slug?: string | null) {
  if (!slug) return undefined;
  const normalized = normalizeText(slug);
  return colleges.find((college) => normalizeText(college.slug) === normalized);
}

export function findCollegeBySearchTerm(term?: string | null) {
  if (!term) return undefined;
  const normalized = normalizeText(term);
  if (!normalized) return undefined;
  return colleges.find((college) =>
    [college.slug, college.name, college.shortName, college.areaName, ...college.aliases]
      .map(normalizeText)
      .some((value) => value === normalized || value.includes(normalized) || normalized.includes(value)),
  );
}

export function distanceKmBetween(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(bLat - aLat);
  const dLng = toRadians(bLng - aLng);
  const lat1 = toRadians(aLat);
  const lat2 = toRadians(bLat);
  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function collegeBounds(college: CollegeRecord) {
  const latDelta = college.searchRadiusKm / 111;
  const lngDelta =
    college.searchRadiusKm /
    (111 * Math.max(Math.cos((college.latitude * Math.PI) / 180), 0.2));
  return {
    latitude: {
      gte: college.latitude - latDelta,
      lte: college.latitude + latDelta,
    },
    longitude: {
      gte: college.longitude - lngDelta,
      lte: college.longitude + lngDelta,
    },
  };
}

function walkingMinutes(distanceKm: number) {
  if (distanceKm <= 0.1) return 1;
  if (distanceKm <= 0.25) return 2;
  if (distanceKm <= 0.4) return 4;
  return Math.round(distanceKm * 12.5);
}

function drivingMinutes(distanceKm: number) {
  if (distanceKm <= 0.5) return 2;
  return Math.max(3, Math.round(distanceKm * 2.3) + (distanceKm > 2 ? 3 : 0));
}

function baseStudentFriendlyScore(property: PropertyCollegeInput) {
  let score = 20;

  if (property.category === PropertyCategory.PG) score += 22;
  else if (property.category === PropertyCategory.LOFT) score += 16;
  else if (property.category === PropertyCategory.STUDIO) score += 14;
  else if (property.category === PropertyCategory.APARTMENT) score += 9;
  else if (property.category === PropertyCategory.VILLA) score -= 6;
  else if (property.category === PropertyCategory.COMMERCIAL) score -= 12;

  if (property.price <= 9000) score += 16;
  else if (property.price <= 13000) score += 13;
  else if (property.price <= 17000) score += 10;
  else if (property.price <= 24000) score += 7;
  else if (property.price <= 32000) score += 4;

  const amenityWeights: Array<[string, number]> = [
    ["wifi", 10],
    ["laundry", 8],
    ["housekeeping", 8],
    ["meals", 12],
    ["security", 8],
    ["study", 5],
    ["desk", 5],
    ["parking", 3],
    ["power", 4],
    ["backup", 4],
    ["ac", 3],
    ["common lounge", 3],
    ["co-working", 4],
    ["metro", 2],
    ["balcony", 2],
  ];
  const amenityText = property.amenities.join(" ").toLowerCase();
  for (const [needle, weight] of amenityWeights) {
    if (amenityText.includes(needle)) score += weight;
  }

  if (property.verified) score += 10;
  if (property.ownerPhoneVerified) score += 8;
  if (property.reviewCount >= 2) score += 4;
  if (property.viewCount >= 700) score += 5;

  return score;
}

function scoreForCollege(property: PropertyCollegeInput, college: CollegeRecord, distanceKm: number) {
  let score = baseStudentFriendlyScore(property);

  if (distanceKm <= 1) score += 18;
  else if (distanceKm <= 2.5) score += 14;
  else if (distanceKm <= 4) score += 9;
  else if (distanceKm <= college.searchRadiusKm) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function collegeMatchesForProperty(
  property: PropertyCollegeInput,
  preferredCollegeSlug?: string,
) {
  if (property.latitude == null || property.longitude == null) return [];

  const matches = colleges
    .map((college) => {
      const distanceKm = distanceKmBetween(
        property.latitude!,
        property.longitude!,
        college.latitude,
        college.longitude,
      );
      if (distanceKm > college.searchRadiusKm) return null;

      const studentFriendlyScore = scoreForCollege(property, college, distanceKm);
      const popularAmongStudents =
        studentFriendlyScore >= 78 &&
        (property.category === PropertyCategory.PG ||
          property.viewCount >= 650 ||
          property.reviewCount >= 2);

      return {
        collegeSlug: college.slug,
        collegeName: college.name,
        shortName: college.shortName,
        areaName: college.areaName,
        locality: college.locality,
        latitude: college.latitude,
        longitude: college.longitude,
        distanceKm: Number(distanceKm.toFixed(distanceKm < 1 ? 2 : 1)),
        walkingMinutes: walkingMinutes(distanceKm),
        drivingMinutes: drivingMinutes(distanceKm),
        studentFriendlyScore,
        popularAmongStudents,
        verifiedNearCampus:
          property.verified && property.ownerPhoneVerified && distanceKm <= Math.min(3.5, college.searchRadiusKm),
      } satisfies PropertyCollegeMatch;
    })
    .filter((match): match is PropertyCollegeMatch => Boolean(match))
    .sort((left, right) => {
      if (preferredCollegeSlug) {
        const leftPreferred = left.collegeSlug === preferredCollegeSlug ? 1 : 0;
        const rightPreferred = right.collegeSlug === preferredCollegeSlug ? 1 : 0;
        if (leftPreferred !== rightPreferred) return rightPreferred - leftPreferred;
      }
      if (left.distanceKm !== right.distanceKm) return left.distanceKm - right.distanceKm;
      return right.studentFriendlyScore - left.studentFriendlyScore;
    });

  return matches.slice(0, 3);
}

