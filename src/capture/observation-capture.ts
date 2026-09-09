import { createObservation, type ObservationInput } from '../validation/observation.schema';
import type { Observation } from '../domain/observation';
import type { ObservationStore } from '../store/observation-store';

export interface ObservationExtractor {
  extract(fieldNote: string): Promise<readonly ObservationInput[]>;
}

export class ExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExtractionError';
  }
}

export class DeterministicObservationExtractor implements ObservationExtractor {
  async extract(fieldNote: string): Promise<readonly ObservationInput[]> {
    const text = fieldNote.trim();
    const modality = text.match(/\b(MRI|MR|CT|ultrasound|US|x-ray|xray)\b/i)?.[1];
    const site = text.match(/(?:at|site)\s+([^,.;]+?)(?:,|\s+in\s+)/i)?.[1]?.trim();
    const client = text.match(/client\s+([^,.;]+?)(?:,|\s+site\s+)/i)?.[1]?.trim();
    const quantityMatch = text.match(/\b(\d+|one|two|three|four|five)\s+(?=(?:units?|machines?|systems?|devices?|MRI|MR|CT|ultrasound|US)\b)/i)?.[1]?.toLowerCase();
    const quantity = quantityMatch === undefined ? 1 : ({ one: 1, two: 2, three: 3, four: 4, five: 5 }[quantityMatch] ?? Number(quantityMatch));
    const brand = text.match(/brand\s+([^,.;]+)/i)?.[1]?.trim() ?? null;
    const model = text.match(/model\s+([^,.;]+)/i)?.[1]?.trim() ?? null;
    const age = text.match(/\b(\d+)\s+years?\s+old\b/i)?.[1];
    const hours = text.match(/\b(\d+(?:\.\d+)?)\s+hours?\b/i)?.[1];
    const comment = text.match(/comment\s+([^.;]+)/i)?.[1]?.trim() ?? null;

    if (modality === undefined || site === undefined || client === undefined) {
      throw new ExtractionError('Include a modality, client, and site in the Field note.');
    }

    return [{
      site: { client: { name: client }, name: site, city: 'Unknown', country: 'Unknown' },
      modality,
      modalityProvenance: 'Reported',
      brand,
      model,
      quantity,
      quantityProvenance: 'Reported',
      age: age === undefined ? null : { min: Number(age), max: Number(age) },
      ageProvenance: age === undefined ? 'Unknown' : 'Reported',
      use: hours === undefined ? null : { hours: Number(hours), period: null },
      useProvenance: hours === undefined ? null : 'Reported',
      comment,
      fieldNote: text,
      collaborator: null,
      visitDate: new Date().toISOString().slice(0, 10),
    }];
  }
}


export async function captureObservation(
  fieldNote: string,
  extractor: ObservationExtractor,
  store: ObservationStore,
): Promise<readonly Observation[]> {
  if (fieldNote.trim() === '') throw new ExtractionError('Enter a Field note before extracting.');
  const inputs = await extractor.extract(fieldNote);
  if (inputs.length === 0) throw new ExtractionError('QVAC returned no Observations.');
  return Promise.all(inputs.map((input) => createObservation(input)).map((observation) => store.save(observation)));
}
