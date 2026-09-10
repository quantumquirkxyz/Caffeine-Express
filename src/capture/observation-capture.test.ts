import { describe, expect, it, vi } from 'vitest';
import { captureObservation, DeterministicObservationExtractor, ExtractionError, parseObservationsJson } from './observation-capture';
import { MemoryObservationStore } from '../store/memory-observation-store';
import type { ObservationInput } from '../validation/observation.schema';

describe('typed Observation capture', () => {
  it('extracts, validates, and persists a Field note while preserving Unknown Age', async () => {
    const store = new MemoryObservationStore();
    const observation = await captureObservation(
      'Two MRI machines at Pacific Hospital, client DemoCare, brand NovaMed, model N-1, 1200 hours, comment planned replacement',
      new DeterministicObservationExtractor(),
      store,
    );

    expect(observation).toHaveLength(1);
    expect(observation[0]?.modality).toBe('MRI');
    expect(observation[0]?.quantity).toBe(2);
    expect(observation[0]?.age).toBeNull();
    expect(observation[0]?.ageProvenance).toBe('Unknown');
    expect(observation[0]?.comment).toBe('planned replacement');
    expect(await store.all()).toHaveLength(1);
  });

  it('surfaces extraction errors without persisting', async () => {
    const store = new MemoryObservationStore();
    await expect(captureObservation('The equipment is busy.', new DeterministicObservationExtractor(), store))
      .rejects.toThrow(ExtractionError);
    expect(await store.all()).toHaveLength(0);
  });

  it('supports a deterministic injected QVAC seam', async () => {
    const store = new MemoryObservationStore();
    const extractor = { extract: vi.fn(async () => [{
      site: { client: { name: 'Client' }, name: 'Site', city: 'City', country: 'Country' },
      modality: 'MR', modalityProvenance: 'Estimated' as const, quantity: 1, quantityProvenance: 'Reported' as const,
      age: null, ageProvenance: 'Unknown' as const, visitDate: '2026-09-09',
    }]) };
    const observation = await captureObservation('fixture', extractor, store);
    expect(observation[0]?.modality).toBe('MRI');
    expect(extractor.extract).toHaveBeenCalledWith('fixture');
  });

  it('persists every Observation returned for one Field note', async () => {
    const store = new MemoryObservationStore();
    const extractor = new DeterministicObservationExtractor();
    const input = await extractor.extract('one MRI at Site, client Client, brand A, model One');
    const second: ObservationInput = { ...input[0]!, brand: 'B', model: 'Two' };
    const two = { extract: vi.fn(async () => [...input, second]) };
    const observations = await captureObservation('two devices', two, store);
    expect(observations).toHaveLength(2);
    expect(await store.all()).toHaveLength(2);
  });

  it('parses the QVAC wrapper object into an observations array', () => {
    const observations = parseObservationsJson('{"observations":[{"modality":"MRI"}]}');
    expect(observations).toHaveLength(1);
    expect(observations[0]?.modality).toBe('MRI');
  });

  it('rejects QVAC output without an observations array', () => {
    expect(() => parseObservationsJson('{"data":[{"modality":"MRI"}]}')).toThrow(ExtractionError);
  });

  it('rejects malformed QVAC JSON', () => {
    expect(() => parseObservationsJson('not json')).toThrow(ExtractionError);
  });
});
