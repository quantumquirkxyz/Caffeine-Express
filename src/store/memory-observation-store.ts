import {
  observationKey,
  observationKeyEquals,
  type Observation,
  type ObservationId,
  type ObservationKey,
} from '../domain/observation';
import type { ObservationStore } from './observation-store';

export class ObservationAlreadyPersistedError extends Error {
  constructor(readonly id: ObservationId) {
    super(`Observation ${id} is already persisted`);
    this.name = 'ObservationAlreadyPersistedError';
  }
}

export class MemoryObservationStore implements ObservationStore {
  private readonly observations = new Map<ObservationId, Observation>();

  async save(observation: Observation): Promise<Observation> {
    if (this.observations.has(observation.id)) {
      throw new ObservationAlreadyPersistedError(observation.id);
    }
    this.observations.set(observation.id, observation);
    return observation;
  }

  async all(): Promise<readonly Observation[]> {
    return [...this.observations.values()];
  }

  async findById(id: ObservationId): Promise<Observation | null> {
    return this.observations.get(id) ?? null;
  }

  async findByKey(key: ObservationKey): Promise<readonly Observation[]> {
    return [...this.observations.values()].filter((observation) =>
      observationKeyEquals(observationKey(observation), key),
    );
  }
}