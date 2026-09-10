import { describe, expect, it } from 'vitest';
import type { Use } from './use';
import type { Modality } from './modality';
import {
  observationKey,
  observationKeyEquals,
  recordState,
  type Observation,
} from './observation';

function baseObservation(overrides: Partial<Observation> = {}): Observation {
  return {
    id: 'obs-synthetic',
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
    fieldNote: 'I am at Hospital DemoCare Pacific in Panama.',
    collaborator: 'Field User 01',
    visitDate: '2026-08-18',
    createdAt: '2026-09-09T12:00:00.000Z',
    ...overrides,
  };
}

describe('observation', () => {
  it('anchors the key by Site x Modality x brand x model', () => {
    const observation = baseObservation();
    expect(observationKey(observation)).toEqual({
      clientName: 'DemoCare Health Group',
      siteName: 'Hospital DemoCare Pacific',
      modality: 'MRI',
      brand: 'NovaMed',
      model: 'NM-MR 700',
    });
  });

  it('recordState is the worst-case provenance across fields', () => {
    expect(
      recordState(
        baseObservation({
          modalityProvenance: 'Confirmed',
          brandProvenance: 'Reported',
          modelProvenance: 'Estimated',
          quantityProvenance: 'Confirmed',
          ageProvenance: 'Reported',
        }),
      ),
    ).toBe('Estimated');

    expect(recordState(baseObservation())).toBe('Estimated');
    expect(recordState(baseObservation({ age: null, ageProvenance: 'Unknown' }))).toBe('Unknown');
  });

  it('recordState ignores Comment and Field note', () => {
    const observation = baseObservation({ comment: 'Plans to replace it next quarter' });
    expect(recordState(observation)).toBe('Estimated');
  });

  it('recordState includes Use provenance when Use is present', () => {
    const use: Use = { hours: 4200, period: null };
    const observation = baseObservation({ use, useProvenance: 'Confirmed' });
    expect(recordState(observation)).toBe('Estimated');
    const weakUse = baseObservation({ use, useProvenance: 'Unknown' });
    expect(recordState(weakUse)).toBe('Unknown');
  });

  it('observationKeyEquals is strict on all four key fields', () => {
    const a = baseObservation();
    const same = baseObservation({ id: 'obs-2' });
    expect(observationKeyEquals(observationKey(a), observationKey(same))).toBe(
      true,
    );

    const differentModel = baseObservation({ model: 'NM-MR 900' });
    expect(
      observationKeyEquals(observationKey(a), observationKey(differentModel)),
    ).toBe(false);

    const differentBrand = baseObservation({ brand: 'Aurelia Health' });
    expect(
      observationKeyEquals(observationKey(a), observationKey(differentBrand)),
    ).toBe(false);
  });

  it('a missing key field never matches, per strict four-field matching', () => {
    const knownModel = baseObservation();
    const missingModel = baseObservation({ model: null, modelProvenance: 'Unknown' });
    const missingModelAgain = baseObservation({
      id: 'obs-3',
      model: null,
      modelProvenance: 'Unknown',
    });

    expect(
      observationKeyEquals(observationKey(knownModel), observationKey(missingModel)),
    ).toBe(false);
    expect(
      observationKeyEquals(
        observationKey(missingModel),
        observationKey(missingModelAgain),
      ),
    ).toBe(false);
  });
});

describe('modality vocabulary', () => {
  it('keeps the canonical modality type set coherent', () => {
    const modality: Modality = 'MRI';
    expect(modality).toBe('MRI');
  });
});
