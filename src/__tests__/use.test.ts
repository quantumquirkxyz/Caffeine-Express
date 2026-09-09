import { describe, it, expect } from "vitest";
import { Use } from "../domain/use.js";

describe("Use", () => {
  it("accepts hours without period", () => {
    const result = Use.safeParse({ hours: 5000 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hours).toBe(5000);
      expect(result.data.period).toBeUndefined();
    }
  });

  it("accepts hours with period", () => {
    const result = Use.safeParse({
      hours: 12000,
      period: { start: "2024-01-01", end: "2026-09-01" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.period?.start).toBe("2024-01-01");
    }
  });

  it("accepts zero hours", () => {
    const result = Use.safeParse({ hours: 0 });
    expect(result.success).toBe(true);
  });

  it("rejects negative hours", () => {
    const result = Use.safeParse({ hours: -100 });
    expect(result.success).toBe(false);
  });

  it("rejects non-numeric hours", () => {
    const result = Use.safeParse({ hours: "a lot" });
    expect(result.success).toBe(false);
  });
});
