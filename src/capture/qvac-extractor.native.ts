import { completion } from '@qvac/sdk';
import type { ObservationInput } from '../validation/observation.schema';
import { parseObservationsJson, type ObservationExtractor } from './observation-capture';

export class QVACObservationExtractor implements ObservationExtractor {
  constructor(private readonly modelId: string) {}

  async extract(fieldNote: string): Promise<readonly ObservationInput[]> {
    const run = completion({
      modelId: this.modelId,
      history: [{
        role: 'user',
        content: `Extract one or more equipment observations from this Field note. Respond with a single JSON object that has an "observations" array; each array element must match the ObservationInput fields. Use null for missing optional values and age null when unknown. Field note: ${fieldNote}`,
      }],
      stream: false,
      responseFormat: { type: 'json_object' },
    });
    const result = await run.final;
    return parseObservationsJson(result.contentText);
  }
}
