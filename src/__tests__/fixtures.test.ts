import { describe, it, expect } from "vitest";
import { FIXTURE_OBSERVATIONS, DEMO_CLIENTS } from "../fixtures/observations.js";
import { Observation } from "../domain/observation.js";

describe("Fixtures", () => {
  it("DEMO_CLIENTS contains fictional clients", () => {
    expect(DEMO_CLIENTS.length).toBeGreaterThan(0);
    for (const client of DEMO_CLIENTS) {
      expect(client.name).toBeTruthy();
      expect(client.sites.length).toBeGreaterThan(0);
      for (const site of client.sites) {
        expect(site.id).toBeTruthy();
        expect(site.name).toBeTruthy();
        expect(site.city).toBeTruthy();
        expect(site.country).toBeTruthy();
      }
    }
  });

  it("all fixture observations parse as valid Observations", () => {
    for (const obs of FIXTURE_OBSERVATIONS) {
      const result = Observation.safeParse(obs);
      expect(result.success).toBe(true);
    }
  });

  it("fixture observations cover multiple modalities", () => {
    const modalities = new Set(FIXTURE_OBSERVATIONS.map((o) => o.modality));
    expect(modalities.size).toBeGreaterThanOrEqual(3);
  });

  it("fixture observations include Unknown age", () => {
    const hasUnknown = FIXTURE_OBSERVATIONS.some((o) => o.age === "Unknown");
    expect(hasUnknown).toBe(true);
  });

  it("fixture observations include ranged age", () => {
    const hasRange = FIXTURE_OBSERVATIONS.some(
      (o) => typeof o.age === "object" && "min" in o.age,
    );
    expect(hasRange).toBe(true);
  });

  it("fixture observations include Use with and without period", () => {
    const withPeriod = FIXTURE_OBSERVATIONS.some(
      (o) => o.use?.period !== undefined,
    );
    const withoutPeriod = FIXTURE_OBSERVATIONS.some(
      (o) => o.use !== undefined && o.use.period === undefined,
    );
    expect(withPeriod).toBe(true);
    expect(withoutPeriod).toBe(true);
  });

  it("fixture observations include Comments", () => {
    const withComment = FIXTURE_OBSERVATIONS.some((o) => o.comment !== undefined);
    expect(withComment).toBe(true);
  });

  it("fixture observations cover multiple clients", () => {
    const clients = new Set(FIXTURE_OBSERVATIONS.map((o) => o.clientName));
    expect(clients.size).toBeGreaterThanOrEqual(2);
  });

  it("fixture observations cover multiple sites", () => {
    const sites = new Set(FIXTURE_OBSERVATIONS.map((o) => o.siteId));
    expect(sites.size).toBeGreaterThanOrEqual(2);
  });

  it("fixture observations use fictional names", () => {
    const realNames = ["Siemens", "GE", "Philips", "Canon"];
    for (const obs of FIXTURE_OBSERVATIONS) {
      for (const name of realNames) {
        expect(obs.brand.value).not.toContain(name);
      }
    }
  });

  it("fixture observations have fieldNote as the raw input", () => {
    for (const obs of FIXTURE_OBSERVATIONS) {
      expect(obs.fieldNote.length).toBeGreaterThan(10);
    }
  });
});
