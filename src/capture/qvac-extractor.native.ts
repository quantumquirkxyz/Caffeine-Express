import { completion } from '@qvac/sdk';
import { buildExtractionPrompt, extractObservationsFromContent } from './qvac-contract';
import type { ObservationExtractor } from './observation-capture';

export class QVACObservationExtractor implements ObservationExtractor {
  constructor(private readonly modelId: string) {}

  extract(fieldNote: string): ReturnType<ObservationExtractor['extract']> {
    const run = completion({
      modelId: this.modelId,
      history: [{ role: 'user', content: buildExtractionPrompt(fieldNote) }],
      stream: false,
      responseFormat: { type: 'json_object' },
    });
    return run.final.then((result) =>
      extractObservationsFromContent(result.contentText, { fieldNote }),
    );
  }
}
