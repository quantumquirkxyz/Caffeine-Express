import { z } from "zod";

export const Provenance = z.enum(["Confirmed", "Reported", "Estimated", "Unknown"]);
export type Provenance = z.infer<typeof Provenance>;

const PROVENANCE_STRENGTH: Record<Provenance, number> = {
  Confirmed: 3,
  Reported: 2,
  Estimated: 1,
  Unknown: 0,
};

export function leastFirm(a: Provenance, b: Provenance): Provenance {
  return PROVENANCE_STRENGTH[a] <= PROVENANCE_STRENGTH[b] ? a : b;
}

export function deriveState(fields: Provenance[]): Provenance {
  if (fields.length === 0) return "Unknown";
  return fields.reduce(leastFirm);
}
