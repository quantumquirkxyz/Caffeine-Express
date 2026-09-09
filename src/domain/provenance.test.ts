import { describe, expect, it } from 'vitest';
import {
  firmnessOf,
  isProvenance,
  leastFirm,
  lesserFirm,
  PROVENANCE_FIRMNESS,
  PROVENANCES,
  type Provenance,
} from './provenance';

describe('provenance', () => {
  it('exposes the closed vocabulary', () => {
    expect(PROVENANCES).toEqual([
      'Confirmed',
      'Reported',
      'Estimated',
      'Unknown',
    ]);
  });

  it('orders firmness Confirmed > Reported > Estimated > Unknown', () => {
    expect(firmnessOf('Confirmed')).toBe(4);
    expect(firmnessOf('Reported')).toBe(3);
    expect(firmnessOf('Estimated')).toBe(2);
    expect(firmnessOf('Unknown')).toBe(1);
    const order = [...PROVENANCES].sort(
      (a, b) => PROVENANCE_FIRMNESS[b] - PROVENANCE_FIRMNESS[a],
    );
    expect(order).toEqual(['Confirmed', 'Reported', 'Estimated', 'Unknown']);
  });

  it('guards isProvenance against non-vocabulary input', () => {
    for (const value of PROVENANCES) {
      expect(isProvenance(value)).toBe(true);
    }
    expect(isProvenance('High')).toBe(false);
    expect(isProvenance('quality')).toBe(false);
    expect(isProvenance(42)).toBe(false);
    expect(isProvenance(null)).toBe(false);
  });

  it('leastFirm returns the worst-case provenance', () => {
    const cases: Array<readonly Provenance[]> = [
      ['Reported', 'Confirmed'],
      ['Reported', 'Estimated'],
      ['Estimated', 'Confirmed', 'Reported'],
      ['Confirmed', 'Confirmed'],
      ['Unknown', 'Estimated'],
    ];
    const expected: Provenance[] = [
      'Reported',
      'Estimated',
      'Estimated',
      'Confirmed',
      'Unknown',
    ];
    for (let i = 0; i < cases.length; i++) {
      expect(leastFirm(cases[i] ?? [])).toBe(expected[i]);
    }
  });

  it('leastFirm is empty-safe', () => {
    expect(leastFirm([])).toBe('Confirmed');
  });

  it('lesserFirm picks the less firm of two', () => {
    expect(lesserFirm('Confirmed', 'Estimated')).toBe('Estimated');
    expect(lesserFirm('Unknown', 'Confirmed')).toBe('Unknown');
    expect(lesserFirm('Reported', 'Reported')).toBe('Reported');
  });
});