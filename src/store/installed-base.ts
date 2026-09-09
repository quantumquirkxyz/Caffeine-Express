import { observationKey, type Observation } from '../domain/observation';
import { recordState } from '../domain/observation';
import type { InstalledBaseFilter, InstalledEquipment } from '../domain/installed-equipment';
import { lesserFirm, type Provenance } from '../domain/provenance';

function mergeAge(current: Observation['age'], next: Observation['age']): Observation['age'] {
  if (current === null) return next;
  if (next === null) return current;
  return { min: Math.min(current.min, next.min), max: Math.max(current.max, next.max) };
}

function independentState(observations: readonly Observation[]): Provenance {
  const collaborators = new Set(observations.map((observation) => observation.collaborator).filter((value) => value !== null));
  if (collaborators.size > 1) return 'Confirmed';
  return observations.reduce<Provenance>((state, observation) => lesserFirm(state, recordState(observation)), 'Confirmed');
}

export class InstalledBase {
  private readonly records = new Map<string, InstalledEquipment>();

  update(observation: Observation): InstalledEquipment | null {
    if (observation.brand === null || observation.model === null) return null;
    const key = observationKey(observation);
    const mapKey = JSON.stringify(key);
    const current = this.records.get(mapKey);
    const related = current === undefined
      ? [observation]
      : current.observationIds.map((id) => this.observations.get(id)).filter((item): item is Observation => item !== undefined).concat(observation);
    const latest = related.reduce((a, b) => (b.visitDate >= a.visitDate ? b : a));
    const record: InstalledEquipment = {
      key,
      clientName: observation.site.client.name,
      site: observation.site,
      modality: observation.modality,
      brand: observation.brand,
      model: observation.model,
      quantity: Math.max(...related.map((item) => item.quantity)),
      age: related.reduce<Observation['age']>((age, item) => mergeAge(age, item.age), null),
      use: latest.use,
      state: independentState(related),
      observationIds: related.map((item) => item.id),
    };
    this.records.set(mapKey, record);
    this.observations.set(observation.id, observation);
    return record;
  }

  private readonly observations = new Map<string, Observation>();

  all(): readonly InstalledEquipment[] { return [...this.records.values()]; }

  find(filter: InstalledBaseFilter = {}): readonly InstalledEquipment[] {
    return this.all().filter((record) =>
      (filter.clientName === undefined || record.clientName === filter.clientName) &&
      (filter.siteName === undefined || record.site.name === filter.siteName) &&
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
