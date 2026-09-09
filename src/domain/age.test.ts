import { describe, expect, it } from 'vitest';
import { approximateAgeYears, exactAgeYears, isAgeRange, type AgeRange } from './age';

describe('age range', () => {
  it('isAgeRange guards an inclusive non-negative min-max range', () => {
    const valid: AgeRange = { min: 7, max: 9 };
    expect(isAgeRange(valid)).toBe(true);
    expect(isAgeRange({ min: 0, max: 0 })).toBe(true);
    expect(isAgeRange({ min: 9, max: 7 })).toBe(false);
    expect(isAgeRange({ min: -1, max: 2 })).toBe(false);
    expect(isAgeRange({ min: Number.NaN, max: 2 })).toBe(false);
    expect(isAgeRange(null)).toBe(false);
    expect(isAgeRange('eight')).toBe(false);
  });

  it('exactAgeYears produces the degenerate range', () => {
    expect(exactAgeYears(6)).toEqual({ min: 6, max: 6 });
  });

  it('approximateAgeYears widens into an inclusive band', () => {
    expect(approximateAgeYears(7)).toEqual({ min: 6, max: 8 });
    expect(approximateAgeYears(8)).toEqual({ min: 7, max: 9 });
  });

  it('approximateAgeYears clamps the lower bound at zero', () => {
    expect(approximateAgeYears(0)).toEqual({ min: 0, max: 1 });
    expect(approximateAgeYears(1)).toEqual({ min: 0, max: 2 });
  });

  it('approximateAgeYears rejects non-finite or negative input', () => {
    expect(() => approximateAgeYears(-3)).toThrow(RangeError);
    expect(() => approximateAgeYears(Number.NaN)).toThrow(RangeError);
    expect(() => approximateAgeYears(Number.POSITIVE_INFINITY)).toThrow(
      RangeError,
    );
  });
});