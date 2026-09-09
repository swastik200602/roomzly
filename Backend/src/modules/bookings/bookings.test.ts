import { describe, expect, it } from "vitest";
import { isBookingConflicting, nightsBetween } from "./bookings.service.js";

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
    expect(isBookingConflicting(existing, {
      checkIn: new Date("2026-09-10T00:00:00.000Z"),
      checkOut: new Date("2026-09-20T00:00:00.000Z")
    })).toBe(true);

    // Inside range -> overlap
    expect(isBookingConflicting(existing, {
      checkIn: new Date("2026-09-12T00:00:00.000Z"),
      checkOut: new Date("2026-09-18T00:00:00.000Z")
    })).toBe(true);

    // Enveloping range -> overlap
    expect(isBookingConflicting(existing, {
      checkIn: new Date("2026-09-05T00:00:00.000Z"),
      checkOut: new Date("2026-09-25T00:00:00.000Z")
    })).toBe(true);

    // Completely before -> NO overlap
    expect(isBookingConflicting(existing, {
      checkIn: new Date("2026-09-01T00:00:00.000Z"),
      checkOut: new Date("2026-09-10T00:00:00.000Z")
    })).toBe(false);

    // Completely after -> NO overlap
    expect(isBookingConflicting(existing, {
      checkIn: new Date("2026-09-20T00:00:00.000Z"),
      checkOut: new Date("2026-09-30T00:00:00.000Z")
    })).toBe(false);
  });
});
