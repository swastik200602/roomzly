import { describe, expect, it } from "vitest";
import { PropertyCategory } from "@prisma/client";
import {
  findCollegeBySlug,
  findCollegeBySearchTerm,
  collegeMatchesForProperty,
  type PropertyCollegeMatch,
} from "./colleges.js";

describe("College Geospatial Intelligence", () => {
  it("resolves major Dehradun colleges by slug and aliases", () => {
    const upes = findCollegeBySlug("upes");
    expect(upes).toBeDefined();
    expect(upes?.name).toBe("UPES");
    expect(upes?.areaName).toBe("Bidholi");

    const graphicEra = findCollegeBySearchTerm("graphic era");
    expect(graphicEra).toBeDefined();
    expect(graphicEra?.slug).toBe("graphic-era-university");
    expect(graphicEra?.areaName).toBe("Clement Town");

    const dit = findCollegeBySlug("dit-university");
    expect(dit).toBeDefined();
    expect(dit?.areaName).toBe("Mussoorie Diversion");
  });

  it("calculates accurate distance and campus match for Bidholi PG near UPES", () => {
    // Property at UPES Bidholi Gate
    const matches = collegeMatchesForProperty(
      {
        latitude: 30.4185,
        longitude: 77.9672,
        category: PropertyCategory.PG,
        amenities: ["3 Times Meals", "High-Speed WiFi", "Power Backup", "Study Desk"],
        price: 8500,
        verified: true,
        viewCount: 800,
        reviewCount: 5,
        ownerPhoneVerified: true,
      },
      "upes"
    );

    expect(matches.length).toBeGreaterThan(0);
    const upesMatch = matches.find((m: PropertyCollegeMatch) => m.collegeSlug === "upes");
    expect(upesMatch).toBeDefined();
    expect(upesMatch?.distanceKm).toBeLessThan(1); // Within 1km
    expect(upesMatch?.walkingMinutes).toBeLessThanOrEqual(10); // Walking distance
    expect(upesMatch?.studentFriendlyScore).toBeGreaterThan(70);
  });

  it("scores student PGs higher than expensive luxury villas", () => {
    const pgMatches = collegeMatchesForProperty({
      latitude: 30.4185,
      longitude: 77.9672,
      category: PropertyCategory.PG,
      amenities: ["Meals", "Wifi", "Study"],
      price: 8000,
      verified: true,
      viewCount: 500,
      reviewCount: 3,
      ownerPhoneVerified: true,
    });

    const villaMatches = collegeMatchesForProperty({
      latitude: 30.4185,
      longitude: 77.9672,
      category: PropertyCategory.VILLA,
      amenities: ["Garage"],
      price: 350000,
      verified: false,
      viewCount: 100,
      reviewCount: 0,
      ownerPhoneVerified: false,
    });

    const pgScore = pgMatches[0]?.studentFriendlyScore ?? 0;
    const villaScore = villaMatches[0]?.studentFriendlyScore ?? 0;

    expect(pgScore).toBeGreaterThan(villaScore);
  });
});
