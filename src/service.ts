import type { z } from "zod";
import type { Observation } from "./domain/observation.js";
import type { ObservationRepository } from "./domain/repository.js";
import { validateObservation } from "./domain/validation.js";

export function captureObservation(
  repository: ObservationRepository,
  raw: unknown,
): z.infer<typeof Observation> {
  const validated = validateObservation(raw);
  repository.save(validated.data);
  return validated.data;
}