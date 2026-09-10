import { describe, expect, it } from 'vitest';
import { QVACObservationExtractor } from './qvac-extractor';

describe('web QVAC-compatible extractor', () => {
  it('extracts a valid local ObservationInput for the capture button', async () => {
    const [input] = await new QVACObservationExtractor('web-local-extractor').extract(
      'Two MRI machines at Pacific Hospital, client DemoCare, brand NovaMed, model N-1, 1200 hours',
    );

    expect(input).toMatchObject({
      modality: 'MRI',
      quantity: 2,
      brand: 'NovaMed',
      model: 'N-1',
      use: { hours: 1200, period: null },
    });
  });
});
