import type { AgeRange } from './age';
import type { Modality } from './modality';
import type { Observation, ObservationKey } from './observation';
import type { Provenance } from './provenance';
import type { Use } from './use';

export interface InstalledEquipment {
  readonly key: ObservationKey;
  readonly site: Observation['site'];
  readonly modality: Modality;
  readonly brand: string | null;
  readonly model: string | null;
  readonly quantity: number;
  readonly age: AgeRange | null;
  readonly use: Use | null;
  readonly state: Provenance;
  readonly observationIds: readonly string[];
}

export interface InstalledBaseFilter {
  readonly clientName?: string;
  readonly siteName?: string;
  readonly modality?: Modality;
  readonly brand?: string;
  readonly model?: string;
}
