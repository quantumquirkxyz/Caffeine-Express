import { describe, it, expect } from "vitest";
import { captureObservation } from "../service.js";
import { InMemoryObservationRepository } from "../persistence/InMemoryObservationRepository.js";
import { FIXTURE_OBSERVATIONS } from "../fixtures/observations.js";
import { ValidationError } from "../domain/validation.js";

const VALID_OBSERVATION = FIXTURE_OBSERVATIONS[0];

describe("captureObservation", () => {
  it("validates and persists a valid observation", () => {
    const repo = new InMemoryObservationRepository();
    const saved = captureObservation(repo, VALID_OBSERVATION);
    expect(saved.id).toBe(VALID_OBSERVATION.id);
    expect(repo.findById(VALID_OBSERVATION.id)).toEqual(VALID_OBSERVATION);
  });

  it("rejects malformed input without persisting", () => {
    const repo = new InMemoryObservationRepository();
    const malformed = { ...VALID_OBSERVATION, quantity: 0 };
    expect(() => captureObservation(repo, malformed)).toThrow(ValidationError);
    expect(repo.findAll()).toHaveLength(0);
  });

  it("does not invent values for missing data", () => {
    const repo = new InMemoryObservationRepository();
    const missingBrand = { ...VALID_OBSERVATION, brand: undefined };
    expect(() => captureObservation(repo, missingBrand)).toThrow(ValidationError);
    expect(repo.findAll()).toHaveLength(0);
  });

  it("persists Unknown age without fabricating a range", () => {
    const repo = new InMemoryObservationRepository();
    const obs = { ...VALID_OBSERVATION, age: "Unknown" as const };
    const saved = captureObservation(repo, obs);
    expect(saved.age).toBe("Unknown");
  });
});