import type { AgeRange } from '../domain/age';
import type { InstalledBaseFilter, InstalledEquipment } from '../domain/installed-equipment';
import type { Modality } from '../domain/modality';
import type { Provenance } from '../domain/provenance';
import type { Use } from '../domain/use';
import type { InstalledBase } from '../store/installed-base';

export type DashboardStatus = 'loading' | 'ready' | 'offline' | 'empty' | 'no-results';

export interface DashboardEquipmentRow {
  readonly siteName: string;
  readonly city: string;
  readonly country: string;
  readonly modality: Modality;
  readonly brand: string | null;
  readonly model: string | null;
  readonly quantity: number;
  readonly age: AgeRange | null;
  readonly use: Use | null;
  readonly state: Provenance;
  readonly observationIds: readonly string[];
}

export interface DashboardSiteGroup {
  readonly siteName: string;
  readonly equipment: readonly DashboardEquipmentRow[];
  readonly quantity: number;
}

export interface DashboardClientGroup {
  readonly clientName: string;
  readonly sites: readonly DashboardSiteGroup[];
  readonly quantity: number;
}

export interface DashboardAggregation {
  readonly quantity: number;
  readonly locations: readonly {
    readonly clientName: string;
    readonly siteName: string;
    readonly quantity: number;
  }[];
}

export interface DashboardView {
  readonly status: DashboardStatus;
  readonly clients: readonly DashboardClientGroup[];
  readonly aggregation: DashboardAggregation | null;
}

function toEquipmentRow(record: InstalledEquipment): DashboardEquipmentRow {
  return {
    siteName: record.site.name,
    city: record.site.city,
    country: record.site.country,
    modality: record.modality,
    brand: record.brand,
    model: record.model,
    quantity: record.quantity,
    age: record.age,
    use: record.use,
    state: record.state,
    observationIds: record.observationIds,
  };
}

function sumQuantity(items: readonly { readonly quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function dashboardView(
  base: InstalledBase,
  filter: InstalledBaseFilter = {},
  options: { readonly loading?: boolean; readonly offline?: boolean } = {},
): DashboardView {
  if (options.loading === true) return { status: 'loading', clients: [], aggregation: null };
  const equipment = base.find(filter);
  if (options.offline === true) return { status: 'offline', clients: [], aggregation: null };
  if (base.all().length === 0) return { status: 'empty', clients: [], aggregation: null };
  if (equipment.length === 0) return { status: 'no-results', clients: [], aggregation: null };

  const groups = new Map<string, DashboardClientGroup>();
  for (const record of equipment) {
    const equipmentRow = toEquipmentRow(record);
    const clientName = record.site.client.name;
    const siteName = record.site.name;
    const current = groups.get(clientName) ?? { clientName, sites: [] as DashboardSiteGroup[], quantity: 0 };
    const siteIndex = current.sites.findIndex((site) => site.siteName === siteName);
    const sites = siteIndex === -1
      ? [...current.sites, { siteName, equipment: [equipmentRow], quantity: record.quantity }]
      : current.sites.map((site, index) => index === siteIndex
          ? { ...site, equipment: [...site.equipment, equipmentRow], quantity: sumQuantity([...site.equipment, equipmentRow]) }
          : site);
    groups.set(clientName, {
      clientName,
      sites,
      quantity: sumQuantity(sites.flatMap((site) => site.equipment)),
    });
  }

  return {
    status: 'ready',
    clients: [...groups.values()],
    aggregation: {
      quantity: sumQuantity(equipment),
      locations: equipment.map((item) => ({ clientName: item.site.client.name, siteName: item.site.name, quantity: item.quantity })),
    },
  };
}