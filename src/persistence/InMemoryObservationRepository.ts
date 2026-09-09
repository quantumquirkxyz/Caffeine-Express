import type { Observation } from "../domain/observation.js";
import type { ObservationRepository } from "../domain/repository.js";

function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export class InMemoryObservationRepository implements ObservationRepository {
  private records = new Map<string, Observation>();

  save(observation: Observation): void {
    this.records.set(observation.id, observation);
  }

  findById(id: string): Observation | undefined {
    return this.records.get(id);
  }

  findAll(): Observation[] {
    return Array.from(this.records.values());
  }

  findBySite(siteId: string): Observation[] {
    return this.findAll().filter((o) => o.siteId === siteId);
  }

  findByClient(clientName: string): Observation[] {
    return this.findAll().filter((o) => o.clientName === clientName);
  }

  static key(observation: Observation): string {
    const content = `${observation.siteId}|${observation.modality}|${observation.brand.value}|${observation.model.value}`;
    return fnv1a(content);
  }
}