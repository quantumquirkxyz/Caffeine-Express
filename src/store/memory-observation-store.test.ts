import { describe, expect, it } from 'vitest';
import {
  MemoryObservationStore,
  ObservationAlreadyPersistedError,
} from './memory-observation-store';
import {
  observationKey,
  observationKeyEquals,
  type Observation,
} from '../domain/observation';

function baseObservation(overrides: Partial<Observation> = {}): Observation {
  return {
    id: 'obs-1',
    site: {
      client: { name: 'DemoCare Health Group' },
      name: 'Hospital DemoCare Pacific',
      city: 'Panama City',
      country: 'Panama',
    },
    modality: 'MRI',
    modalityProvenance: 'Reported',
    brand: 'NovaMed',
    brandProvenance: 'Reported',
    model: 'NM-MR 700',
    modelProvenance: 'Reported',
    quantity: 2,
    quantityProvenance: 'Reported',
    age: { min: 6, max: 8 },
    ageProvenance: 'Estimated',
    use: null,
    useProvenance: null,
    comment: null,
    fieldNote: null,
    collaborator: null,
    visitDate: '2026-08-18',
    createdAt: '2026-09-09T12:00:00.000Z',
    ...overrides,
  };
}

describe('MemoryObservationStore', () => {
  it('saves and reloads an Observation', async () => {
    const store = new MemoryObservationStore();
    const observation = baseObservation();
    await store.save(observation);
    expect(await store.findById('obs-1')).toEqual(observation);
    expect(await store.all()).toEqual([observation]);
  });

  it('returns null for an unknown id', async () => {
    const store = new MemoryObservationStore();
    expect(await store.findById('nope')).toBeNull();
  });

  it('is append-only for a given id (immutable records)', async () => {
    const store = new MemoryObservationStore();
    await store.save(baseObservation());
    await expect(store.save(baseObservation())).rejects.toThrow(
      ObservationAlreadyPersistedError,
    );
  });

  it('finds observations by the strict four-field key', async () => {
    const store = new MemoryObservationStore();
    const mri = baseObservation({ id: 'obs-1' });
    const ct = baseObservation({
      id: 'obs-2',
      modality: 'CT',
      brand: 'Aurelia Health',
      model: 'AH-CT 320',
    });
    const secondReport = baseObservation({
      id: 'obs-3',
      quantity: 1,
      comment: 'Independent follow-up report',
    });
    await store.save(mri);
    await store.save(ct);
    await store.save(secondReport);

    const found = await store.findByKey(observationKey(mri));
    expect(found.map((o) => o.id).sort()).toEqual(['obs-1', 'obs-3']);
  });

  it('never matches a partial key, per strict four-field matching', async () => {
    const store = new MemoryObservationStore();
    const knownModel = baseObservation({ id: 'obs-1' });
    const missingModel = baseObservation({ id: 'obs-2', model: null, modelProvenance: 'Unknown' });
    await store.save(knownModel);
    await store.save(missingModel);

    expect(
      observationKeyEquals(observationKey(missingModel), observationKey(missingModel)),
    ).toBe(false);
    expect(await store.findByKey(observationKey(missingModel))).toEqual([]);
    expect(await store.findByKey(observationKey(knownModel))).toEqual([
      knownModel,
    ]);
    expect(await store.findById('obs-2')).toEqual(missingModel);
  });

  it('all() is stable and reflects saved order', async () => {
    const store = new MemoryObservationStore();
    const a = baseObservation({ id: 'obs-a', quantity: 1 });
    const b = baseObservation({ id: 'obs-b', quantity: 2 });
    await store.save(a);
    await store.save(b);
    expect((await store.all()).map((o) => o.id)).toEqual(['obs-a', 'obs-b']);
  });
});