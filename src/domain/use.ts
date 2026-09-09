export interface OperatingPeriod {
  readonly start: Date;
  readonly end: Date;
}

export interface Use {
  readonly hours: number;
  readonly period: OperatingPeriod | null;
}

export type UseValue = Use | null;

export function isUse(value: unknown): value is Use {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { hours, period } = value as Use;
  if (!Number.isFinite(hours) || hours < 0) {
    return false;
  }
  if (period !== null) {
    const { start, end } = period;
    if (!(start instanceof Date) || !(end instanceof Date)) {
      return false;
    }
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return false;
    }
    if (start.getTime() > end.getTime()) {
      return false;
    }
  }
  return true;
}