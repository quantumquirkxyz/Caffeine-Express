import { describe, expect, it } from 'vitest';
import { COPY } from './copy';

function shape(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return typeof value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, child]) => [key, shape(child)]));
}

describe('localized copy', () => {
  it('keeps the same keys in English, Spanish, and Portuguese', () => {
    expect(shape(COPY.es)).toEqual(shape(COPY.en));
    expect(shape(COPY.pt)).toEqual(shape(COPY.en));
  });
});
