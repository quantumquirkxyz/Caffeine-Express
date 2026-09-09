import type { z } from "zod";
import type { Observation } from "./observation.js";

export interface ObservationRepository {
  save(observation: z.infer<typeof Observation>): void;
  findById(id: string): z.infer<typeof Observation> | undefined;
  findAll(): z.infer<typeof Observation>[];
  findBySite(siteId: string): z.infer<typeof Observation>[];
  findByClient(clientName: string): z.infer<typeof Observation>[];
}