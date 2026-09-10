import type { ObservationExtractor } from './observation-capture';
import { QvacRuntimeUnavailableError } from './qvac-runtime';

export class QVACObservationExtractor implements ObservationExtractor {
  constructor(_modelId: string) {}

  extract(fieldNote: string): ReturnType<ObservationExtractor['extract']> {
    return Promise.reject(new QvacRuntimeUnavailableError());
  }
}
