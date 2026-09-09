import type { ObservationExtractor } from './observation-capture';

export class QVACObservationExtractor implements ObservationExtractor {
  constructor(_modelId: string) {}

  async extract(_fieldNote: string): Promise<never> {
    throw new Error('QVAC extraction is available on Android and iOS only.');
  }
}
