import { z } from "zod";
import { Modality } from "./modality.js";
import { Age } from "./age.js";
import { Use } from "./use.js";
import { Provenance, deriveState } from "./provenance.js";

export const ObservationKey = z.object({
  siteId: z.string().min(1),
  modality: Modality,
  brand: z.string().min(1),
  model: z.string().min(1),
});
export type ObservationKey = z.infer<typeof ObservationKey>;

export const FieldWithProvenance = z.object({
  value: z.string().min(1),
  provenance: Provenance,
});
export type FieldWithProvenance = z.infer<typeof FieldWithProvenance>;

export const Observation = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  clientName: z.string().min(1),
  siteId: z.string().min(1),
  siteName: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  modality: Modality,
  brand: FieldWithProvenance,
  model: FieldWithProvenance,
  quantity: z.number().int().min(1),
  age: Age,
  use: Use.optional(),
  comment: z.string().optional(),
  fieldNote: z.string().min(1),
});
export type Observation = z.infer<typeof Observation>;

export function observationState(obs: Observation): Provenance {
  const provenances: Provenance[] = [
    obs.brand.provenance,
    obs.model.provenance,
  ];
  if (obs.age === "Unknown") {
    provenances.push("Unknown");
  }
  return deriveState(provenances);
}
