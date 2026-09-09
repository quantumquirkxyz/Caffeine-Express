import { describe, it, expect } from "vitest";
import { Age, isValidAge } from "../domain/age.js";

describe("Age", () => {
  it("accepts a valid range", () => {
    const result = Age.safeParse({ min: 5, max: 8 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ min: 5, max: 8 });
    }
  });

  it("accepts a degenerate range (min === max)", () => {
    const result = Age.safeParse({ min: 6, max: 6 });
    expect(result.success).toBe(true);
  });

  it("rejects min > max", () => {
    const result = Age.safeParse({ min: 10, max: 5 });
    expect(result.success).toBe(false);
  });

  it("rejects negative values", () => {
    const result = Age.safeParse({ min: -1, max: 5 });
    expect(result.success).toBe(false);
  });

  it("accepts Unknown", () => {
    const result = Age.safeParse("Unknown");
    expect(result.success).toBe(true);
    expect(result.data).toBe("Unknown");
  });

  it("rejects arbitrary strings", () => {
    const result = Age.safeParse("pretty old");
    expect(result.success).toBe(false);
  });

  it("isValidAge returns true for Unknown", () => {
    expect(isValidAge("Unknown")).toBe(true);
  });

  it("isValidAge returns true for valid range", () => {
    expect(isValidAge({ min: 3, max: 7 })).toBe(true);
  });

  it("isValidAge returns false for invalid range", () => {
    expect(isValidAge({ min: 10, max: 5 })).toBe(false);
  });
});
