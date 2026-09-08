import { describe, expect, it } from "vitest";

function nightsBetween(checkIn: Date, checkOut: Date): number {
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  if (nights <= 0) throw new Error("checkOut must be after checkIn");
  return nights;
}

function hasOverlap(
  existing: { checkIn: Date; checkOut: Date },
  requested: { checkIn: Date; checkOut: Date }
): boolean {
  return existing.checkIn < requested.checkOut && existing.checkOut > requested.checkIn;
}

describe("Booking Domain Rules", () => {
  it("computes accurate nights between check-in and check-out", () => {
    const checkIn = new Date("2026-09-10T00:00:00.000Z");
    const checkOut = new Date("2026-09-15T00:00:00.000Z");
    expect(nightsBetween(checkIn, checkOut)).toBe(5);
  });

  it("throws an error if checkOut is before or on checkIn", () => {
    const checkIn = new Date("2026-09-15T00:00:00.000Z");
    const checkOut = new Date("2026-09-10T00:00:00.000Z");
    expect(() => nightsBetween(checkIn, checkOut)).toThrow("checkOut must be after checkIn");

    const sameDate = new Date("2026-09-15T00:00:00.000Z");
    expect(() => nightsBetween(sameDate, sameDate)).toThrow("checkOut must be after checkIn");
  });

  it("accurately detects date collisions and double-booking overlaps", () => {
    const existing = {
      checkIn: new Date("2026-09-10T00:00:00.000Z"),
      checkOut: new Date("2026-09-20T00:00:00.000Z"),
    };

    // Exact match -> overlap
    expect(hasOverlap(existing, {
      checkIn: new Date("2026-09-10T00:00:00.000Z"),
      checkOut: new Date("2026-09-20T00:00:00.000Z")
    })).toBe(true);

    // Inside range -> overlap
    expect(hasOverlap(existing, {
      checkIn: new Date("2026-09-12T00:00:00.000Z"),
      checkOut: new Date("2026-09-18T00:00:00.000Z")
    })).toBe(true);

    // Enveloping range -> overlap
    expect(hasOverlap(existing, {
      checkIn: new Date("2026-09-05T00:00:00.000Z"),
      checkOut: new Date("2026-09-25T00:00:00.000Z")
    })).toBe(true);

    // Completely before -> NO overlap
    expect(hasOverlap(existing, {
      checkIn: new Date("2026-09-01T00:00:00.000Z"),
      checkOut: new Date("2026-09-10T00:00:00.000Z")
    })).toBe(false);

    // Completely after -> NO overlap
    expect(hasOverlap(existing, {
      checkIn: new Date("2026-09-20T00:00:00.000Z"),
      checkOut: new Date("2026-09-30T00:00:00.000Z")
    })).toBe(false);
  });
});
