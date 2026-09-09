import { describe, expect, it } from 'vitest';
import { recordState, type Observation } from '../domain/observation';
import type { ObservationStore } from '../store/observation-store';
import { MemoryObservationStore } from '../store/memory-observation-store';
import {
  loadSyntheticFixtures,
  syntheticFixtureRows,
  toObservationInput,
} from './seed';

const FIXED_NOW = new Date('2026-08-18T10:00:00.000Z');

describe('synthetic fixtures', () => {
  it('defines 22 reproducible fictional rows', () => {
    const rows = syntheticFixtureRows();
    expect(rows).toHaveLength(22);
    expect(new Set(rows.map((r) => r.id)).size).toBe(22);
  });

  it('declares only fictional brand, model, client, and site names', () => {
    const knownBrands = [
      'NovaMed',
      'Aurelia Health',
      'BluePeak Medical',
      'Orion Imaging',
      'HelixCare',
      'Zenith MedTech',
    ];
    for (const row of syntheticFixtureRows()) {
      expect(knownBrands).toContain(row.brand);
      expect(row.clientName).toMatch(/^DemoCare/);
      expect(row.siteName).toMatch(/DemoCare/);
    }
  });

  it('every fixture row builds a valid ObservationInput', () => {
    for (const row of syntheticFixtureRows()) {
      expect(() => toObservationInput(row)).not.toThrow();
    }
  });

  it('loads all 22 rows into the store offline', async () => {
    const store = new MemoryObservationStore();
    const observations = await loadSyntheticFixtures(store, { now: FIXED_NOW });

    expect(observations).toHaveLength(22);
    expect((await store.all())).toHaveLength(22);
    expect(observations.map((o) => o.id)).toEqual(
      Array.from({ length: 22 }, (_, i) => `obs-${String(i + 1).padStart(3, '0')}`),
    );
  });

  it('preserves geography, quantity, State, and Field notes', async () => {
    const observations = await loadSyntheticFixtures(
      new MemoryObservationStore(),
      { now: FIXED_NOW },
    );

    const countries = new Set(observations.map((o) => o.site.country));
    expect(countries).toEqual(
      new Set([
        'Panama',
        'Brazil',
        'Mexico',
        'Chile',
        'Argentina',
        'Colombia',
        'Peru',
        'Costa Rica',
        'Dominican Republic',
        'Ecuador',
      ]),
    );
    expect(observations.map((o) => o.site.name)).toContain('Hospital DemoCare Pacific');
    expect(observations.map((o) => o.fieldNote)).not.toContain(null);
    expect(observations.reduce((sum, o) => sum + o.quantity, 0)).toBe(
      syntheticFixtureRows().reduce((sum, r) => sum + r.quantity, 0),
    );
  });

  it('normalizes MR modality to canonical MRI', async () => {
    const observations = await loadSyntheticFixtures(
      new MemoryObservationStore(),
      { now: FIXED_NOW },
    );
    expect(new Set(observations.map((o) => o.modality))).toEqual(
      new Set(['MRI', 'CT', 'Ultrasound']),
    );
    expect(observations.filter((o) => (o.modality as string) === 'MR')).toHaveLength(
      0,
    );
  });

  it('converts scalar approximate age into an inclusive range', async () => {
    const observations = await loadSyntheticFixtures(
      new MemoryObservationStore(),
      { now: FIXED_NOW },
    );
    const obs001 = observations.find((o) => o.id === 'obs-001');
    expect(obs001?.age).toEqual({ min: 6, max: 8 });
    const obs021 = observations.find((o) => o.id === 'obs-021');
    expect(obs021?.age).toBeNull();
    expect(obs021?.ageProvenance).toBe('Unknown');
    for (const observation of observations) {
      if (observation.age !== null) {
        expect(observation.age.min).toBeGreaterThanOrEqual(0);
        expect(observation.age.min).toBeLessThanOrEqual(observation.age.max);
      }
    }
  });

  it('keeps an Unknown Age row reproducible without invented bounds', async () => {
    const observations = await loadSyntheticFixtures(
      new MemoryObservationStore(),
      { now: FIXED_NOW },
    );
    const obs021 = observations.find((o) => o.id === 'obs-021');
    expect(obs021?.age).toBeNull();
    expect(obs021?.ageProvenance).toBe('Unknown');
    expect(recordState(obs021 as Observation)).toBe('Unknown');
  });

  it('keeps a Use fixture row reproducible with hours and period', async () => {
    const observations = await loadSyntheticFixtures(
      new MemoryObservationStore(),
      { now: FIXED_NOW },
    );
    const obs022 = observations.find((o) => o.id === 'obs-022');
    expect(obs022?.use).toEqual({
      hours: 8500,
      period: {
        start: new Date('2026-01-01T00:00:00.000Z'),
        end: new Date('2026-08-03T00:00:00.000Z'),
      },
    });
    expect(obs022?.useProvenance).toBe('Reported');
  });

  it('keeps missing brand/model as Unknown without invented values', async () => {
    const observations = await loadSyntheticFixtures(
      new MemoryObservationStore(),
      { now: FIXED_NOW },
    );
    const obs012 = observations.find((o) => o.id === 'obs-012');
    const obs020 = observations.find((o) => o.id === 'obs-020');
    expect(obs012?.model).toBeNull();
    expect(obs012?.modelProvenance).toBe('Unknown');
    expect(obs020?.model).toBeNull();
    expect(obs020?.modelProvenance).toBe('Unknown');
    for (const id of ['obs-012', 'obs-020']) {
      const observation = observations.find((o) => o.id === id);
      if (observation !== undefined) {
        expect(recordState(observation)).toBe('Unknown');
      }
    }
  });

  it('is fully reproducible with a fixed clock', async () => {
    const first = await loadSyntheticFixtures(new MemoryObservationStore(), {
      now: FIXED_NOW,
    });
    const second = await loadSyntheticFixtures(new MemoryObservationStore(), {
      now: FIXED_NOW,
    });
    expect(first).toEqual(second);
    expect(second[0]?.createdAt).toBe('2026-08-18T10:00:00.000Z');
  });

  it('refuses to load twice into the same append-only store', async () => {
    const store = new MemoryObservationStore();
    await loadSyntheticFixtures(store, { now: FIXED_NOW });
    await expect(loadSyntheticFixtures(store, { now: FIXED_NOW })).rejects.toThrow();
  });
});

describe('seed store shape', () => {
  it('has multiple Clients and Sites across observations', async () => {
    const store: ObservationStore = new MemoryObservationStore();
    const observations: readonly Observation[] = await loadSyntheticFixtures(store, {
      now: FIXED_NOW,
    });
    const clients = new Set(observations.map((o) => o.site.client.name));
    const sites = new Set(observations.map((o) => o.site.name));
    expect(clients.size).toBeGreaterThan(1);
    expect(sites.size).toBe(13);
    expect(await store.all()).toHaveLength(22);
  });
});