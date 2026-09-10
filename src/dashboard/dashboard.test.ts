import { describe, expect, it } from 'vitest';
import { loadSyntheticFixtures } from '../fixtures/seed';
import { MemoryObservationStore } from '../store/memory-observation-store';
import { InstalledBase } from '../store/installed-base';
import { dashboardView, overviewAggregation } from './dashboard';

async function seededBase(): Promise<InstalledBase> {
  const store = new MemoryObservationStore();
  const base = new InstalledBase();
  for (const observation of await loadSyntheticFixtures(store, { now: new Date('2026-08-18T10:00:00.000Z') })) base.update(observation);
  return base;
}

describe('dashboard view', () => {
  it('groups installed equipment by Client and Site and exposes fields', async () => {
    const view = dashboardView(await seededBase());
    expect(view.status).toBe('ready');
    expect(view.clients.length).toBeGreaterThan(1);
    expect(view.clients.flatMap((client) => client.sites).length).toBeGreaterThan(1);
    expect(view.clients.flatMap((client) => client.sites).flatMap((site) => site.equipment)).toEqual(
      expect.arrayContaining([expect.objectContaining({ modality: 'MRI', quantity: expect.any(Number), age: expect.anything() })]),
    );
  });

  it('aggregates a selected modality across Clients and Sites', async () => {
    const view = dashboardView(await seededBase(), { modality: 'MRI' });
    expect(view.aggregation?.quantity).toBeGreaterThan(0);
    expect(new Set(view.aggregation?.locations.map((location) => location.clientName)).size).toBeGreaterThan(1);
  });

  it('derives site and client quantities from equipment quantities', async () => {
    const view = dashboardView(await seededBase());
    for (const client of view.clients) {
      for (const site of client.sites) {
        expect(site.quantity).toBe(site.equipment.reduce((sum, item) => sum + item.quantity, 0));
      }
      expect(client.quantity).toBe(client.sites.flatMap((site) => site.equipment).reduce((sum, item) => sum + item.quantity, 0));
    }
    expect(view.aggregation?.quantity).toBe(
      view.clients.flatMap((client) => client.sites).flatMap((site) => site.equipment).reduce((sum, item) => sum + item.quantity, 0),
    );
  });

  it('represents loading, offline, empty, and no-result states', async () => {
    const base = await seededBase();
    expect(dashboardView(base, {}, { loading: true }).status).toBe('loading');
    expect(dashboardView(base, {}, { offline: true }).status).toBe('offline');
    expect(dashboardView(new InstalledBase()).status).toBe('empty');
    expect(dashboardView(base, { modality: 'CT', brand: 'not-installed' }).status).toBe('no-results');
  });

  it('builds global summary aggregation independently of inventory filters', async () => {
    const base = await seededBase();
    const aggregation = overviewAggregation(base);
    const filtered = dashboardView(base, { modality: 'MRI' });

    expect(aggregation.units).toBeGreaterThan(filtered.aggregation?.quantity ?? 0);
    expect(aggregation.byModality.find((entry) => entry.label === 'MRI')?.value).toBe(15);
    expect(aggregation.byClient.length).toBeGreaterThan(1);
    expect(aggregation.sitesByClient.length).toBe(aggregation.byClient.length);
  });
});
