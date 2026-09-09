import { describe, it, expect } from "vitest";
import { deriveState, leastFirm, type Provenance } from "../domain/provenance.js";

describe("Provenance", () => {
  it("leastFirm returns the weaker provenance", () => {
    expect(leastFirm("Confirmed", "Reported")).toBe("Reported");
    expect(leastFirm("Reported", "Estimated")).toBe("Estimated");
    expect(leastFirm("Estimated", "Unknown")).toBe("Unknown");
    expect(leastFirm("Unknown", "Confirmed")).toBe("Unknown");
  });

  it("leastFirm treats equal provenances as equal", () => {
    expect(leastFirm("Reported", "Reported")).toBe("Reported");
    expect(leastFirm("Unknown", "Unknown")).toBe("Unknown");
  });

  it("deriveState returns Unknown for empty array", () => {
    expect(deriveState([])).toBe("Unknown");
  });

  it("deriveState returns the single provenance for one field", () => {
    expect(deriveState(["Confirmed"])).toBe("Confirmed");
    expect(deriveState(["Estimated"])).toBe("Estimated");
  });

  it("deriveState returns the worst-case across multiple fields", () => {
    const fields: Provenance[] = ["Confirmed", "Reported", "Estimated"];
    expect(deriveState(fields)).toBe("Estimated");
  });

  it("deriveState returns Unknown when any field is Unknown", () => {
    const fields: Provenance[] = ["Confirmed", "Reported", "Unknown"];
    expect(deriveState(fields)).toBe("Unknown");
  });

  it("deriveState returns Confirmed only when all fields are Confirmed", () => {
    const fields: Provenance[] = ["Confirmed", "Confirmed", "Confirmed"];
    expect(deriveState(fields)).toBe("Confirmed");
  });
});
