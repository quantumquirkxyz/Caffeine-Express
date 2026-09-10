import { completion } from '@qvac/sdk';
import {
  buildExtractionPrompt,
  extractObservationsFromContentWithRetry,
} from './qvac-contract';
import type { ObservationExtractor } from './observation-capture';

export class QVACObservationExtractor implements ObservationExtractor {
  constructor(private readonly modelId: string) {}

  extract(fieldNote: string): ReturnType<ObservationExtractor['extract']> {
    return extractObservationsFromContentWithRetry(
      async () => {
        const run = completion({
          modelId: this.modelId,
          history: [{ role: 'user', content: buildExtractionPrompt(fieldNote) }],
          stream: false,
          responseFormat: { type: 'json_object' },
        });
        const result = await run.final;
        return result.contentText;
      },
      { fieldNote },
    );
  }
}