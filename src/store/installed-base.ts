import { observationKey, recordState, type Observation, type ObservationKey } from '../domain/observation';
import type { InstalledBaseFilter, InstalledEquipment } from '../domain/installed-equipment';
import { leastFirm, type Provenance } from '../domain/provenance';

function mergeAge(current: Observation['age'], next: Observation['age']): Observation['age'] {
  if (current === null) return next;
  if (next === null) return current;
  return { min: Math.min(current.min, next.min), max: Math.max(current.max, next.max) };
}

function mergedState(observations: readonly Observation[]): Provenance {
  return leastFirm(observations.map(recordState));
}

function installedEquipmentKey(key: ObservationKey): string {
  return JSON.stringify([key.clientName, key.siteName, key.modality, key.brand, key.model]);
}

export class InstalledBase {
  private readonly records = new Map<string, InstalledEquipment>();
  private readonly observations = new Map<string, Observation>();

  update(observation: Observation): InstalledEquipment {
    const key = observationKey(observation);
    const mapKey = installedEquipmentKey(key);
    const current = this.records.get(mapKey);
    const related = current === undefined
      ? [observation]
      : current.observationIds.map((id) => this.observations.get(id)).filter((item): item is Observation => item !== undefined).concat(observation);
    const latest = related.reduce((a, b) => (b.visitDate >= a.visitDate ? b : a));
    const record: InstalledEquipment = {
      key,
      site: observation.site,
      modality: observation.modality,
      brand: observation.brand,
      model: observation.model,
      quantity: Math.max(...related.map((item) => item.quantity)),
      age: related.reduce<Observation['age']>((age, item) => mergeAge(age, item.age), null),
      use: latest.use,
      state: mergedState(related),
      observationIds: related.map((item) => item.id),
    };
    this.records.set(mapKey, record);
    this.observations.set(observation.id, observation);
    return record;
  }

  all(): readonly InstalledEquipment[] { return [...this.records.values()]; }

  find(filter: InstalledBaseFilter = {}): readonly InstalledEquipment[] {
    return this.all().filter((record) =>
      (filter.clientName === undefined || record.site.client.name === filter.clientName) &&
      (filter.siteName === undefined || record.site.name === filter.siteName) &&
      (filter.country === undefined || record.site.country === filter.country) &&
      (filter.modality === undefined || record.modality === filter.modality) &&
      (filter.brand === undefined || record.brand === filter.brand) &&
      (filter.model === undefined || record.model === filter.model),
    );
  }

  aggregate(filter: InstalledBaseFilter = {}): { readonly quantity: number; readonly equipment: readonly InstalledEquipment[] } {
    const equipment = this.find(filter);
    return { quantity: equipment.reduce((sum, item) => sum + item.quantity, 0), equipment };
  }
}
