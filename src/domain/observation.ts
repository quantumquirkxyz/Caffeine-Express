import type { AgeRange } from './age';
import type { Modality } from './modality';
import { leastFirm, type Provenance } from './provenance';
import type { Site } from './site';
import type { Use } from './use';

export type ObservationId = string;

export interface Observation {
  readonly id: ObservationId;
  readonly site: Site;
  readonly modality: Modality;
  readonly modalityProvenance: Provenance;
  readonly brand: string | null;
  readonly brandProvenance: Provenance;
  readonly model: string | null;
  readonly modelProvenance: Provenance;
  readonly quantity: number;
  readonly quantityProvenance: Provenance;
  readonly age: AgeRange | null;
  readonly ageProvenance: Provenance;
  readonly use: Use | null;
  readonly useProvenance: Provenance | null;
  readonly comment: string | null;
  readonly fieldNote: string | null;
  readonly collaborator: string | null;
  readonly visitDate: string;
  readonly createdAt: string;
}

export interface ObservationKey {
  readonly clientName: string;
  readonly siteName: string;
  readonly modality: Modality;
  readonly brand: string | null;
  readonly model: string | null;
}

export function observationKey(observation: Observation): ObservationKey {
  return {
    clientName: observation.site.client.name,
    siteName: observation.site.name,
    modality: observation.modality,
    brand: observation.brand,
    model: observation.model,
  };
}

export function observationKeyEquals(
  a: ObservationKey,
  b: ObservationKey,
): boolean {
  if (a.clientName !== b.clientName || a.siteName !== b.siteName || a.modality !== b.modality) {
    return false;
  }
  if (a.brand === null || b.brand === null || a.model === null || b.model === null) {
    return false;
  }
  return a.brand === b.brand && a.model === b.model;
}

export function recordState(observation: Observation): Provenance {
  const provenances: Provenance[] = [
    observation.modalityProvenance,
    observation.brandProvenance,
    observation.modelProvenance,
    observation.quantityProvenance,
    observation.ageProvenance,
  ];
  if (observation.use !== null && observation.useProvenance !== null) {
    provenances.push(observation.useProvenance);
  }
  return leastFirm(provenances);
}
