import { approximateAgeYears } from '../domain/age';
import type { Observation } from '../domain/observation';
import type { ObservationStore } from '../store/observation-store';
import {
  createObservation,
  type ObservationInput,
} from '../validation/observation.schema';
import { SYNTHETIC_FIXTURE_ROWS, type SyntheticFixtureRow } from './synthetic';

export interface LoadSyntheticFixturesOptions {
  readonly now?: Date;
}

export function syntheticFixtureRows(): readonly SyntheticFixtureRow[] {
  return SYNTHETIC_FIXTURE_ROWS;
}

export function toObservationInput(row: SyntheticFixtureRow): ObservationInput {
  const model = row.model ?? null;
  const age = row.approximateAgeYears === null
    ? null
    : approximateAgeYears(row.approximateAgeYears);
  return {
    site: {
      client: { name: row.clientName },
      name: row.siteName,
      city: row.city,
      country: row.country,
    },
    modality: row.modality,
    modalityProvenance: row.provenance.modality ?? 'Reported',
    brand: row.brand,
    brandProvenance: row.provenance.brand ?? 'Reported',
    model,
    modelProvenance: model === null ? 'Unknown' : (row.provenance.model ?? 'Reported'),
    quantity: row.quantity,
    quantityProvenance: row.provenance.quantity ?? 'Reported',
    age,
    ageProvenance: age === null ? 'Unknown' : (row.provenance.age ?? 'Estimated'),
    use: row.use ?? null,
    useProvenance: row.use === undefined ? null : (row.provenance.use ?? 'Reported'),
    comment: row.comment,
    fieldNote: row.fieldNote,
    collaborator: row.collaborator,
    visitDate: row.visitDate,
  };
}

export async function loadSyntheticFixtures(
  store: ObservationStore,
  options: LoadSyntheticFixturesOptions = {},
): Promise<readonly Observation[]> {
  const observations: Observation[] = [];
  for (const row of SYNTHETIC_FIXTURE_ROWS) {
    const input = toObservationInput(row);
    const observation = createObservation(input, {
      id: row.id,
      now: options.now ?? new Date('2026-08-18T10:00:00.000Z'),
    });
    observations.push(await store.save(observation));
  }
  return observations;
}