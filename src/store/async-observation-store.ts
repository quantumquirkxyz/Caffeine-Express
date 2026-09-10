import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Observation, ObservationId, ObservationKey } from '../domain/observation';
import { observationKey, observationKeyEquals } from '../domain/observation';
import type { ObservationStore } from './observation-store';
import { ObservationAlreadyPersistedError } from './memory-observation-store';

const STORAGE_KEY = 'fieldsight.observations.v1';

export class AsyncObservationStore implements ObservationStore {
  private readonly observations = new Map<ObservationId, Observation>();
  private hydrated: Promise<void> | null = null;

  private async ensureHydrated(): Promise<void> {
    this.hydrated ??= AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw === null) return;
      (JSON.parse(raw) as Observation[]).forEach(observation => this.observations.set(observation.id, observation));
    });
    await this.hydrated;
  }

  async save(observation: Observation): Promise<Observation> {
    await this.ensureHydrated();
    if (this.observations.has(observation.id)) throw new ObservationAlreadyPersistedError(observation.id);
    this.observations.set(observation.id, observation);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...this.observations.values()]));
    return observation;
  }
  async all(): Promise<readonly Observation[]> { await this.ensureHydrated(); return [...this.observations.values()]; }
  async findById(id: ObservationId): Promise<Observation | null> { await this.ensureHydrated(); return this.observations.get(id) ?? null; }
  async findByKey(key: ObservationKey): Promise<readonly Observation[]> {
    await this.ensureHydrated();
    return [...this.observations.values()].filter(observation => observationKeyEquals(observationKey(observation), key));
  }
}
