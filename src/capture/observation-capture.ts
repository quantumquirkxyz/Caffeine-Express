import { createObservation, type ObservationInput } from '../validation/observation.schema';
import type { Observation } from '../domain/observation';
import type { ObservationStore } from '../store/observation-store';

export interface ObservationExtractor {
  extract(fieldNote: string): Promise<readonly ObservationInput[]>;
}

export { parseModelContent as parseObservationsJson } from './qvac-contract';

export class ExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExtractionError';
  }
}

export class DeterministicObservationExtractor implements ObservationExtractor {
  async extract(fieldNote: string): Promise<readonly ObservationInput[]> {
    const text = fieldNote.trim();
    const notes = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (notes.length === 0) throw new ExtractionError('Enter a Field note before extracting.');

    let contextSite: string | undefined;
    let contextClient: string | undefined;
    return notes.map((note) => {
      const modality = note.match(/\b(MRI|MR|CT|ultrasound|US|x-ray|xray|rayos\s+X|tomógrafo(?:s)?|tomografo(?:s)?|ecógrafo(?:s)?|ecografo(?:s)?|ultrasonido(?:s)?)\b/i)?.[1];
      const detectedSite = note.match(/(?:at|en)\s+(?:el\s+|la\s+)?((?:hospital|cl[ií]nica|site|sitio)\s+[^,.;]+?)(?=\s+(?:observ|tiene|hay|encontr|pero|instalado|usa|planea|de aproximadamente)|,|$)/i)?.[1]?.trim()
        ?? note.match(/(?:site|sitio)\s+([^,.;]+)/i)?.[1]?.trim()
        ?? note.match(/(?:at|in)\s+([^,.;]+?)(?:,|\s+(?:in|site|client)\s+)/i)?.[1]?.trim();
      const detectedClient = note.match(/(?:client|cliente)\s+([^,.;]+?)(?:,|\s+(?:site|sitio)\s+)/i)?.[1]?.trim();
      if (detectedSite) contextSite = detectedSite;
      if (detectedClient) contextClient = detectedClient;
      const site = contextSite ?? 'Unknown';
      const client = contextClient ?? 'Unknown';
      const quantityMatch = note.match(/\b(\d+|one|two|three|four|five)\s+(?=(?:units?|machines?|systems?|devices?|MRI|MR|CT|ultrasound|US)\b)/i)?.[1]?.toLowerCase();
      const quantity = quantityMatch === undefined ? 1 : ({ one: 1, two: 2, three: 3, four: 4, five: 5 }[quantityMatch] ?? Number(quantityMatch));
      const brand = note.match(/brand\s+([^,.;]+)/i)?.[1]?.trim() ?? null;
      const model = note.match(/model\s+([^,.;]+)/i)?.[1]?.trim() ?? null;
      const age = note.match(/\b(\d+)\s+(?:years?|años?)\s+(?:old|de antigüedad)?\b/i)?.[1] ?? (note.match(/\bhace\s+(\d+)\s+años?\b/i)?.[1]);
      const hours = note.match(/\b(\d+(?:\.\d+)?)\s+hours?\b/i)?.[1];
      const comment = note.match(/comment\s+([^.;]+)/i)?.[1]?.trim() ?? null;

      if (modality === undefined) {
        throw new ExtractionError('No equipment modality was recognized in this Field note.');
      }

      return {
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
      };
    });
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
