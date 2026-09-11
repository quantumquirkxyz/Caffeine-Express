import type { Language } from '../preferences';

export type AppCopy = {
  readonly clients: string; readonly sites: string; readonly units: string; readonly placeholder: string; readonly extract: string; readonly processing: string; readonly saved: string;
  readonly overview: { readonly kicker: string; readonly title: string; readonly modality: string; readonly client: string; readonly sites: string; readonly modalitySubtitle: string; readonly clientSubtitle: string; readonly sitesSubtitle: string; readonly empty: string; readonly unitLabel?: string };
  readonly inventory: { readonly kicker: string; readonly filters: string; readonly filter: string; readonly close: string; readonly all: string; readonly country: string; readonly client: string; readonly site: string; readonly modality: string; readonly brand: string; readonly model: string; readonly equipment: string; readonly evidence: string; readonly linked: string; readonly select: string; readonly unknownLocation: string; readonly unknownBrand: string; readonly unknownModel: string; readonly years: string; readonly ageUnknown: string };
  readonly capture: { readonly kicker: string; readonly title: string; readonly engine: string; readonly noCloud: string; readonly fieldNote: string; readonly transcript: string; readonly organizing: string; readonly compare: string };
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
  capture: { kicker: 'CAPTURE AT THE EDGE', title: 'Describe what you saw. FieldSight does the rest.', engine: 'QVAC engine', noCloud: 'No cloud inference', fieldNote: 'FIELD NOTE', transcript: 'DICTATION TRANSCRIPT', organizing: 'QVAC is organizing the text without changing the facts…', compare: 'Compare this transcript with the editable Field note before saving.' },
};

export const COPY: Record<Language, AppCopy> = {
  en: ENGLISH_COPY,
  es: {
    ...ENGLISH_COPY,
    clients: 'clientes', sites: 'sitios', units: 'unidades',
    placeholder: 'Dos equipos MRI en Hospital Pacific, cliente DemoCare, marca NovaMed, modelo N-1',
    extract: 'Procesar con IA', processing: 'Procesando localmente', saved: 'Observación guardada',
    nav: { overview: 'Resumen', capture: 'Captura', inventory: 'Base instalada', settings: 'Configuración' },
    capture: { kicker: 'CAPTURA EN EL BORDE', title: 'Describe lo que viste. FieldSight hace el resto.', engine: 'Motor QVAC', noCloud: 'Sin inferencia en la nube', fieldNote: 'NOTA DE CAMPO', transcript: 'TRANSCRIPCIÓN', organizing: 'QVAC está organizando el texto sin cambiar los hechos…', compare: 'Compara la transcripción con la nota editable antes de guardar.' },
    theme: { light: 'Claro', dark: 'Oscuro', system: 'Sistema' },
    overview: { kicker: 'RESUMEN', title: 'Base instalada', modality: 'Equipos por modalidad', client: 'Equipos por cliente', sites: 'Sitios por cliente', modalitySubtitle: 'Unidades en la base instalada', clientSubtitle: 'Agregación global sin filtros', sitesSubtitle: 'Distribución geográfica', empty: 'No hay datos disponibles', unitLabel: 'unidades totales' },
    inventory: { kicker: 'BASE INSTALADA', filters: 'Filtros', filter: 'Filtrar', close: 'Cerrar', all: 'Todos', country: 'País', client: 'Cliente', site: 'Sitio', modality: 'Modalidad', brand: 'Marca', model: 'Modelo', equipment: 'Equipos instalados', evidence: 'Evidencia y observaciones', linked: 'Observaciones vinculadas', select: 'Selecciona un equipo para revisar su evidencia.', unknownLocation: 'Ubicación no disponible', unknownBrand: 'Marca desconocida', unknownModel: 'Modelo desconocido', years: 'años', ageUnknown: 'Desconocida' },
  },
  pt: {
    ...ENGLISH_COPY,
    clients: 'clientes', sites: 'locais', units: 'unidades',
    placeholder: 'Dois equipamentos MRI no Hospital Pacific, cliente DemoCare, marca NovaMed, modelo N-1',
    extract: 'Processar com IA', processing: 'Processando localmente', saved: 'Observacao salva',
    nav: { overview: 'Visao geral', capture: 'Captura', inventory: 'Base instalada', settings: 'Configuracoes' },
    capture: { kicker: 'CAPTURA NA BORDA', title: 'Descreva o que viu. O FieldSight faz o resto.', engine: 'Motor QVAC', noCloud: 'Sem inferência na nuvem', fieldNote: 'NOTA DE CAMPO', transcript: 'TRANSCRIÇÃO', organizing: 'O QVAC está organizando o texto sem alterar os fatos…', compare: 'Compare a transcrição com a nota editável antes de salvar.' },
    theme: { light: 'Claro', dark: 'Escuro', system: 'Sistema' },
    overview: { kicker: 'VISÃO GERAL', title: 'Base instalada', modality: 'Equipamentos por modalidade', client: 'Equipamentos por cliente', sites: 'Locais por cliente', modalitySubtitle: 'Unidades na base instalada', clientSubtitle: 'Agregação global sem filtros', sitesSubtitle: 'Distribuição geográfica', empty: 'Nenhum dado disponível', unitLabel: 'unidades totais' },
    inventory: { kicker: 'BASE INSTALADA', filters: 'Filtros', filter: 'Filtrar', close: 'Fechar', all: 'Todos', country: 'País', client: 'Cliente', site: 'Local', modality: 'Modalidade', brand: 'Marca', model: 'Modelo', equipment: 'Equipamentos instalados', evidence: 'Evidências e observações', linked: 'Observações vinculadas', select: 'Selecione um equipamento para revisar suas evidências.', unknownLocation: 'Localização indisponível', unknownBrand: 'Marca desconhecida', unknownModel: 'Modelo desconhecido', years: 'anos', ageUnknown: 'Desconhecida' },
  },
};
