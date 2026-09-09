import { describe, it, expect } from "vitest";
import { InMemoryObservationRepository } from "../persistence/InMemoryObservationRepository.js";
import { FIXTURE_OBSERVATIONS } from "../fixtures/observations.js";

describe("InMemoryObservationRepository", () => {
  it("saves and finds an observation by id", () => {
    const repo = new InMemoryObservationRepository();
    const obs = FIXTURE_OBSERVATIONS[0];
    repo.save(obs);
    expect(repo.findById(obs.id)).toEqual(obs);
  });

  it("returns undefined for unknown id", () => {
    const repo = new InMemoryObservationRepository();
    expect(repo.findById("bogus")).toBeUndefined();
  });

  it("returns all saved observations", () => {
    const repo = new InMemoryObservationRepository();
    for (const obs of FIXTURE_OBSERVATIONS) repo.save(obs);
    expect(repo.findAll()).toHaveLength(FIXTURE_OBSERVATIONS.length);
  });

  it("finds observations by site", () => {
    const repo = new InMemoryObservationRepository();
    for (const obs of FIXTURE_OBSERVATIONS) repo.save(obs);
    const meridian = repo.findBySite("site-meridian-central");
    expect(meridian.length).toBe(2);
    expect(meridian.every((o) => o.siteId === "site-meridian-central")).toBe(true);
  });

  it("finds observations by client", () => {
    const repo = new InMemoryObservationRepository();
    for (const obs of FIXTURE_OBSERVATIONS) repo.save(obs);
    const solvida = repo.findByClient("SolVida Clinics");
    expect(solvida.length).toBe(2);
    expect(solvida.every((o) => o.clientName === "SolVida Clinics")).toBe(true);
  });

  it("overwrites an observation with the same id", () => {
    const repo = new InMemoryObservationRepository();
    const obs = FIXTURE_OBSERVATIONS[0];
    repo.save(obs);
    const replacement = { ...obs, quantity: 5 };
    repo.save(replacement);
    expect(repo.findAll()).toHaveLength(1);
    expect(repo.findById(obs.id)?.quantity).toBe(5);
  });

  it("derives a stable key from Site x Modality x brand x model", () => {
    const repo = new InMemoryObservationRepository();
    const a = FIXTURE_OBSERVATIONS[0];
    const b = { ...a, id: "550e8400-e29b-41d4-a716-446655440001" };
    expect(InMemoryObservationRepository.key(a)).toBe(
      InMemoryObservationRepository.key(b),
    );
    const diffBrand = {
      ...a,
      brand: { value: "OtherBrand", provenance: "Reported" as const },
    };
    expect(InMemoryObservationRepository.key(a)).not.toBe(
      InMemoryObservationRepository.key(diffBrand),
    );
  });
});