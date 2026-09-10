import { describe, expect, it } from 'vitest';
import { QVACObservationExtractor } from './qvac-extractor';

describe('non-native QVAC extractor', () => {
  it('does not substitute local heuristics for QVAC', async () => {
    await expect(new QVACObservationExtractor('unavailable').extract('MRI at Pacific Hospital'))
      .rejects.toThrow('QVAC model load is available on Android and iOS only.');
  });
});
