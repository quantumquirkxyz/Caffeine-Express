import { DeterministicObservationExtractor, type ObservationExtractor } from './observation-capture';

export class QVACObservationExtractor implements ObservationExtractor {
  private readonly fallback = new DeterministicObservationExtractor();

  constructor(_modelId: string) {}

  extract(fieldNote: string): ReturnType<ObservationExtractor['extract']> {
    return this.fallback.extract(fieldNote);
  }
}
