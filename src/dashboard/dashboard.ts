import type { AgeRange } from '../domain/age';
import type { InstalledBaseFilter } from '../domain/installed-equipment';
import type { InstalledBase } from '../store/installed-base';
import type { Use } from '../domain/use';

export type DashboardStatus = 'loading' | 'ready' | 'offline' | 'empty' | 'no-results';

export interface DashboardEquipmentRow {
  readonly siteName: string;
  readonly city: string;
  readonly country: string;
  readonly modality: string;
  readonly brand: string | null;
  readonly model: string | null;
  readonly quantity: number;
  readonly age: AgeRange | null;
  readonly use: Use | null;
  readonly state: string;
  readonly observationIds: readonly string[];
}

export interface DashboardClientGroup {
  readonly clientName: string;
  readonly sites: readonly {
    readonly siteName: string;
    readonly equipment: readonly DashboardEquipmentRow[];
    readonly quantity: number;
  }[];
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

type MutableClientGroup = {
  clientName: string;
  sites: { siteName: string; equipment: DashboardEquipmentRow[]; quantity: number }[];
  quantity: number;
};

function row(record: ReturnType<InstalledBase['all']>[number]): DashboardEquipmentRow {
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

  const clients = new Map<string, MutableClientGroup>();
  for (const record of equipment) {
    const clientName = record.site.client.name;
    const client = clients.get(clientName) ?? { clientName, sites: [], quantity: 0 };
    const existingSite = client.sites.find((site) => site.siteName === record.site.name);
    const equipmentRow = row(record);
    if (existingSite !== undefined) {
      client.sites = client.sites.map((site) => site.siteName === existingSite.siteName
        ? { ...site, equipment: [...site.equipment, equipmentRow], quantity: site.quantity + record.quantity }
        : site);
    } else {
      client.sites = [...client.sites, { siteName: record.site.name, equipment: [equipmentRow], quantity: record.quantity }];
    }
    client.quantity += record.quantity;
    clients.set(clientName, client);
  }

  return {
    status: 'ready',
    clients: [...clients.values()],
    aggregation: {
      quantity: equipment.reduce((sum, item) => sum + item.quantity, 0),
      locations: equipment.map((item) => ({ clientName: item.site.client.name, siteName: item.site.name, quantity: item.quantity })),
    },
  };
}
