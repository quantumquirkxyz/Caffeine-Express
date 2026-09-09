import { describe, expect, it } from 'vitest';
import { loadSyntheticFixtures } from '../fixtures/seed';
import { MemoryObservationStore } from './memory-observation-store';
import { InstalledBase } from './installed-base';

describe('InstalledBase', () => {
  it('resolves complete and incomplete observations without inventing values', async () => {
    const store = new MemoryObservationStore();
    const observations = await loadSyntheticFixtures(store);
    const base = new InstalledBase();
    observations.forEach((observation) => base.update(observation));

    expect(base.all()).toHaveLength(22);
    expect(base.all().some((record) => record.model === null)).toBe(true);
    expect(base.find({ clientName: 'DemoCare Brasil Sul' })).toHaveLength(4);
    expect(base.find({ model: 'NM-MR 700' })[0]?.quantity).toBe(2);
    expect(base.find({ model: 'NM-MR 700' })[0]?.age).toEqual({ min: 6, max: 8 });
  });

  it('reconciles matching reports without inventing values', async () => {
    const store = new MemoryObservationStore();
    const observations = await loadSyntheticFixtures(store);
    const base = new InstalledBase();
    const first = observations.find((item) => item.id === 'obs-001');
    if (first === undefined) throw new Error('fixture row missing');
    const second = { ...first, id: 'obs-follow-up', quantity: 1, age: { min: 5, max: 9 }, collaborator: 'Independent User' };
    base.update(first);
    base.update(second);
    expect(base.find({ model: 'NM-MR 700' })[0]).toMatchObject({ quantity: 2, age: { min: 5, max: 9 } });
    expect(base.find({ model: 'NM-MR 700' })[0]?.state).toBe('Estimated');
    expect(base.find({ model: 'NM-MR 700' })[0]?.use).toBeNull();
  });

  it('aggregates quantity across Sites and Clients and keeps Age/Use', async () => {
    const store = new MemoryObservationStore();
    const observations = await loadSyntheticFixtures(store);
    const base = new InstalledBase();
    observations.forEach((observation) => base.update(observation));
    expect(base.aggregate({ modality: 'MRI' }).quantity).toBe(15);
    expect(base.aggregate({ brand: 'BluePeak Medical' }).quantity).toBe(6);
    expect(base.aggregate({ clientName: 'DemoCare Brasil Sul', modality: 'CT' }).quantity).toBe(2);
    expect(base.find({ model: 'NM-CT 500' })[0]?.age).toBeNull();
    const ultrasound = base.aggregate({ modality: 'Ultrasound' });
    expect(ultrasound.equipment.some((record) => record.age !== null)).toBe(true);
    expect(ultrasound.equipment.some((record) => record.use !== null)).toBe(true);
  });
});
