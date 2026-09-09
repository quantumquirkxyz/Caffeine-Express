import { describe, expect, it, vi } from 'vitest';
import { captureObservation, DeterministicObservationExtractor, ExtractionError } from './observation-capture';
import { MemoryObservationStore } from '../store/memory-observation-store';

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
});
