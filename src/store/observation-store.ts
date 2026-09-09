import type { Observation, ObservationId, ObservationKey } from '../domain/observation';

export interface ObservationStore {
  save(observation: Observation): Promise<Observation>;
  all(): Promise<readonly Observation[]>;
  findById(id: ObservationId): Promise<Observation | null>;
  findByKey(key: ObservationKey): Promise<readonly Observation[]>;
}