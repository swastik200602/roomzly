import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/app-error.js";

describe("AppError", () => {
  it("preserves standardized error fields", () => {
    const error = new AppError(409, "CONFLICT", "Already exists", { field: "email" });

    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("CONFLICT");
    expect(error.message).toBe("Already exists");
    expect(error.details).toEqual({ field: "email" });
  });
});
