import type { Language } from '../preferences';

export type AppCopy = {
  readonly clients: string; readonly sites: string; readonly units: string; readonly placeholder: string; readonly extract: string; readonly processing: string; readonly saved: string;
  readonly overview: { readonly kicker: string; readonly title: string; readonly modality: string; readonly client: string; readonly sites: string; readonly modalitySubtitle: string; readonly clientSubtitle: string; readonly sitesSubtitle: string; readonly empty: string };
  readonly inventory: { readonly kicker: string; readonly filters: string; readonly filter: string; readonly close: string; readonly all: string; readonly country: string; readonly client: string; readonly site: string; readonly modality: string; readonly brand: string; readonly model: string; readonly equipment: string; readonly evidence: string; readonly linked: string; readonly select: string; readonly unknownLocation: string; readonly unknownBrand: string; readonly unknownModel: string; readonly years: string; readonly ageUnknown: string };
  readonly nav: { readonly overview: string; readonly capture: string; readonly inventory: string; readonly settings: string };
  readonly theme: { readonly light: string; readonly dark: string; readonly system: string };
};

const ENGLISH_COPY: AppCopy = {
  clients: 'clients',
  sites: 'sites',
  units: 'units',
  placeholder: 'Two MRI systems at Pacific Hospital, client DemoCare, brand NovaMed, model N-1',
  extract: 'Process with AI',
  processing: 'Processing locally',
  saved: 'Observation saved',
  overview: {
    kicker: 'OVERVIEW',
    title: 'Installed base',
    modality: 'Equipment by modality',
    client: 'Equipment by client',
    sites: 'Sites by client',
    modalitySubtitle: 'Units across the installed base',
    clientSubtitle: 'Global aggregation without inventory filters',
    sitesSubtitle: 'Geographic distribution',
    empty: 'No data available',
  },
  inventory: {
    kicker: 'INSTALLED BASE',
    filters: 'Filters',
    filter: 'Filter',
    close: 'Close',
    all: 'All',
    country: 'Country',
    client: 'Client',
    site: 'Site',
    modality: 'Modality',
    brand: 'Brand',
    model: 'Model',
    equipment: 'Equipment inventory',
    evidence: 'Evidence and observations',
    linked: 'Linked observations',
    select: 'Select equipment to review its evidence.',
    unknownLocation: 'No location available',
    unknownBrand: 'Unknown brand',
    unknownModel: 'Unknown model',
    years: 'years',
    ageUnknown: 'Unknown',
  },
  nav: { overview: 'Overview', capture: 'Capture', inventory: 'Installed base', settings: 'Settings' },
  theme: { light: 'Light', dark: 'Dark', system: 'System' },
};

export const COPY: Record<Language, AppCopy> = {
  en: ENGLISH_COPY,
  es: ENGLISH_COPY,
  pt: ENGLISH_COPY,
};
