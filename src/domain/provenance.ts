export const PROVENANCES = [
  'Confirmed',
  'Reported',
  'Estimated',
  'Unknown',
] as const;

export type Provenance = (typeof PROVENANCES)[number];

export const PROVENANCE_FIRMNESS: Record<Provenance, number> = {
  Confirmed: 4,
  Reported: 3,
  Estimated: 2,
  Unknown: 1,
};

export function isProvenance(value: unknown): value is Provenance {
  return (
    typeof value === 'string' &&
    (PROVENANCES as readonly string[]).includes(value)
  );
}

export function firmnessOf(provenance: Provenance): number {
  return PROVENANCE_FIRMNESS[provenance];
}

export function lesserFirm(a: Provenance, b: Provenance): Provenance {
  return firmnessOf(a) <= firmnessOf(b) ? a : b;
}

export function leastFirm(provenances: readonly Provenance[]): Provenance {
  if (provenances.length === 0) {
    return 'Confirmed';
  }
  let weakest: Provenance = 'Confirmed';
  for (const provenance of provenances) {
    weakest = lesserFirm(weakest, provenance);
  }
  return weakest;
}