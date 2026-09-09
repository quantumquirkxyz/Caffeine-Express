import { describe, it, expect } from "vitest";
import { Observation, observationState, type Observation as ObservationType } from "../domain/observation.js";
import { validateObservation, ValidationError } from "../domain/validation.js";

const VALID_OBSERVATION: ObservationType = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  createdAt: "2026-09-09T10:00:00Z",
  clientName: "Meridian Health Partners",
  siteId: "site-meridian-central",
  siteName: "Meridian Central Hospital",
  city: "Cartagena",
  country: "Colombia",
  modality: "MRI",
  brand: { value: "NovaMed", provenance: "Reported" },
  model: { value: "UltraScan 3T", provenance: "Reported" },
  quantity: 2,
  age: { min: 6, max: 8 },
  use: { hours: 12400 },
  comment: "Both units in radiology wing",
  fieldNote: "Two NovaMed UltraScan 3T MRI machines, about 6 to 8 years old.",
};

describe("Observation schema", () => {
  it("accepts a fully valid observation", () => {
    const result = Observation.safeParse(VALID_OBSERVATION);
    expect(result.success).toBe(true);
  });

  it("accepts observation without optional use and comment", () => {
    const { use, comment, ...required } = VALID_OBSERVATION;
    const result = Observation.safeParse(required);
    expect(result.success).toBe(true);
  });

  it("accepts Unknown age", () => {
    const obs = { ...VALID_OBSERVATION, age: "Unknown" };
    const result = Observation.safeParse(obs);
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const { clientName, ...incomplete } = VALID_OBSERVATION;
    const result = Observation.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it("rejects empty brand value", () => {
    const obs = {
      ...VALID_OBSERVATION,
      brand: { value: "", provenance: "Reported" },
    };
    const result = Observation.safeParse(obs);
    expect(result.success).toBe(false);
  });

  it("rejects invalid modality", () => {
    const obs = { ...VALID_OBSERVATION, modality: "Banana" };
    const result = Observation.safeParse(obs);
    expect(result.success).toBe(false);
  });

  it("rejects quantity less than 1", () => {
    const obs = { ...VALID_OBSERVATION, quantity: 0 };
    const result = Observation.safeParse(obs);
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID", () => {
    const obs = { ...VALID_OBSERVATION, id: "not-a-uuid" };
    const result = Observation.safeParse(obs);
    expect(result.success).toBe(false);
  });

  it("rejects invalid datetime", () => {
    const obs = { ...VALID_OBSERVATION, createdAt: "not-a-date" };
    const result = Observation.safeParse(obs);
    expect(result.success).toBe(false);
  });

  it("rejects invalid provenance", () => {
    const obs = {
      ...VALID_OBSERVATION,
      brand: { value: "NovaMed", provenance: "Bogus" },
    };
    const result = Observation.safeParse(obs);
    expect(result.success).toBe(false);
  });
});

describe("observationState", () => {
  it("returns Reported when all fields are Reported", () => {
    const obs = { ...VALID_OBSERVATION };
    expect(observationState(obs)).toBe("Reported");
  });

  it("returns Estimated when brand is Estimated", () => {
    const obs = {
      ...VALID_OBSERVATION,
      brand: { value: "NovaMed", provenance: "Estimated" as const },
    };
    expect(observationState(obs)).toBe("Estimated");
  });

  it("returns Unknown when age is Unknown", () => {
    const obs = { ...VALID_OBSERVATION, age: "Unknown" as const };
    expect(observationState(obs)).toBe("Unknown");
  });

  it("returns Confirmed when all fields are Confirmed", () => {
    const obs = {
      ...VALID_OBSERVATION,
      age: { min: 6, max: 8 },
      brand: { value: "NovaMed", provenance: "Confirmed" as const },
      model: { value: "UltraScan 3T", provenance: "Confirmed" as const },
    };
    expect(observationState(obs)).toBe("Confirmed");
  });
});

describe("validateObservation", () => {
  it("returns parsed data for valid input", () => {
    const result = validateObservation(VALID_OBSERVATION);
    expect(result.success).toBe(true);
    expect(result.data.clientName).toBe("Meridian Health Partners");
  });

  it("throws ValidationError for malformed input", () => {
    expect(() => validateObservation({})).toThrow(ValidationError);
  });

  it("throws ValidationError for invented values", () => {
    const bogus = { ...VALID_OBSERVATION, modality: "Banana" };
    expect(() => validateObservation(bogus)).toThrow(ValidationError);
  });

  it("ValidationError includes Zod issues", () => {
    try {
      validateObservation({});
      expect.fail("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      const ve = e as ValidationError;
      expect(ve.issues.length).toBeGreaterThan(0);
    }
  });
});
