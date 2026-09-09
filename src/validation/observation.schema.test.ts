import { describe, expect, it } from 'vitest';
import { recordState } from '../domain/observation';
import {
  createObservation,
  ObservationValidationError,
  parseObservationInput,
  type ObservationInput,
} from './observation.schema';

function validInput(overrides: Partial<ObservationInput> = {}): ObservationInput {
  return {
    site: {
      client: { name: 'DemoCare Health Group' },
      name: 'Hospital DemoCare Pacific',
      city: 'Panama City',
      country: 'Panama',
    },
    modality: 'MR',
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
    ...overrides,
  };
}

describe('observation validation', () => {
  it('accepts a complete, well-formed extraction output', () => {
    const observation = createObservation(validInput(), {
      id: 'obs-1',
      now: new Date('2026-09-09T12:00:00.000Z'),
    });
    expect(observation.id).toBe('obs-1');
    expect(observation.modality).toBe('MRI');
    expect(observation.brand).toBe('NovaMed');
    expect(observation.model).toBe('NM-MR 700');
    expect(observation.quantity).toBe(2);
    expect(observation.age).toEqual({ min: 6, max: 8 });
    expect(observation.site.client.name).toBe('DemoCare Health Group');
    expect(observation.createdAt).toBe('2026-09-09T12:00:00.000Z');
  });

  it('maps missing Age to Unknown instead of inventing a value', () => {
    const observation = createObservation(
      validInput({ age: null, ageProvenance: 'Unknown' }),
      { id: 'obs-2' },
    );
    expect(observation.age).toBeNull();
    expect(observation.ageProvenance).toBe('Unknown');
    expect(recordState(observation)).toBe('Unknown');
  });

  it('maps an absent Age field to Unknown', () => {
    const { age: _age, ageProvenance: _ageProvenance, ...input } = validInput();
    const observation = createObservation(input, { id: 'obs-3' });
    expect(observation.age).toBeNull();
    expect(observation.ageProvenance).toBe('Unknown');
  });

  it('sets an omitted brand to Unknown and forces Unknown provenance', () => {
    const { brand: _brand, ...input } = validInput();
    const observation = createObservation(input, { id: 'obs-4' });
    expect(observation.brand).toBeNull();
    expect(observation.brandProvenance).toBe('Unknown');
  });

  it('preserves explicit Use hours with an optional period', () => {
    const period = { start: new Date('2025-01-01T00:00:00.000Z'), end: new Date('2025-12-31T00:00:00.000Z') };
    const observation = createObservation(
      validInput({
        use: { hours: 1200, period },
        useProvenance: 'Reported',
      }),
      { id: 'obs-5' },
    );
    expect(observation.use).toEqual({ hours: 1200, period });
    expect(observation.useProvenance).toBe('Reported');

    const noPeriod = createObservation(
      validInput({ use: { hours: 40, period: null }, useProvenance: 'Reported' }),
      { id: 'obs-6' },
    );
    expect(noPeriod.use?.period).toBeNull();
  });

  it('treats an absent Use as null', () => {
    const { use: _use, useProvenance: _useProvenance, ...input } = validInput();
    const observation = createObservation(input, { id: 'obs-7' });
    expect(observation.use).toBeNull();
    expect(observation.useProvenance).toBeNull();
  });

  it('trims brand, model, and comment', () => {
    const observation = createObservation(
      validInput({
        brand: '  NovaMed ',
        model: ' NM-MR 700 ',
        comment: '  Two MR systems observed.  ',
      }),
      { id: 'obs-8' },
    );
    expect(observation.brand).toBe('NovaMed');
    expect(observation.model).toBe('NM-MR 700');
    expect(observation.comment).toBe('Two MR systems observed.');
  });

  it('rejects malformed extraction without inventing values', () => {
    const invalidInputs: Array<[string, Partial<ObservationInput>]> = [
      ['zero quantity', { quantity: 0 }],
      ['negative quantity', { quantity: -1 }],
      ['fractional quantity', { quantity: 2.5 }],
      ['missing quantity', { quantity: undefined as unknown as number }],
      ['reversed age range', { age: { min: 9, max: 7 } }],
      ['negative age', { age: { min: -1, max: 2 } }],
      ['age as text', { age: 'old' as unknown as { min: number; max: number } }],
      ['unknown modality', { modality: 'spectrograph' }],
      ['empty modality', { modality: '   ' }],
      ['empty brand', { brand: '' }],
      ['whitespace brand', { brand: '   ' }],
      ['empty model', { model: '' }],
      ['negative use hours', { use: { hours: -5, period: null } }],
      ['reversed use period', { use: { hours: 5, period: { start: new Date('2026-01-01'), end: new Date('2025-01-01') } } }],
      ['provenance is a confidence label', { modalityProvenance: 'High' as never }],
      ['bad visit date format', { visitDate: '18/08/2026' }],
    ];

    for (const [label, overrides] of invalidInputs) {
      const result = parseObservationInput(validInput(overrides));
      expect(result.ok, `${label} should be rejected`).toBe(false);
    }
  });

  it('rejects inputs that are structurally wrong', () => {
    expect(parseObservationInput(null).ok).toBe(false);
    expect(parseObservationInput('nonsense').ok).toBe(false);
    expect(parseObservationInput({}).ok).toBe(false);
  });

  it('createObservation surfaces a structured validation error', () => {
    expect(() => createObservation(validInput({ quantity: 0 }))).toThrow(
      ObservationValidationError,
    );
  });

  it('keeps Comment free-text separate from structured fields', () => {
    const observation = createObservation(
      validInput({
        comment: 'They plan to replace the CT next quarter.',
        quantity: 1,
      }),
      { id: 'obs-9' },
    );
    expect(observation.comment).toBe('They plan to replace the CT next quarter.');
    expect(observation.quantity).toBe(1);
  });
});