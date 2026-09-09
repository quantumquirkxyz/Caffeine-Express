export interface AgeRange {
  readonly min: number;
  readonly max: number;
}

export type Age = AgeRange | null;

export function isAgeRange(value: unknown): value is AgeRange {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { min, max } = value as AgeRange;
  return (
    Number.isFinite(min) &&
    Number.isFinite(max) &&
    min >= 0 &&
    max >= 0 &&
    min <= max
  );
}

export function exactAgeYears(years: number): AgeRange {
  if (!Number.isFinite(years) || years < 0) {
    throw new RangeError(`years must be a finite non-negative number, got ${years}`);
  }
  return { min: years, max: years };
}

export function approximateAgeYears(approx: number): AgeRange {
  if (!Number.isFinite(approx) || approx < 0) {
    throw new RangeError(`approx must be a finite non-negative number, got ${approx}`);
  }
  const lower = Math.max(0, Math.floor(approx) - 1);
  const upper = Math.ceil(approx) + 1;
  return { min: lower, max: upper };
}

export function ageIsUnknown(age: Age): age is null {
  return age === null;
}