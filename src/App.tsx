import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { captureObservation } from './capture/observation-capture';
import { QVACObservationExtractor } from './capture/qvac-extractor';
import { loadQvacModel, unloadQvacModel } from './capture/qvac-runtime';
import { dashboardView, type DashboardView } from './dashboard/dashboard';
import type { AgeRange } from './domain/age';
import type { Modality } from './domain/modality';
import { loadSyntheticFixtures } from './fixtures/seed';
import { InstalledBase } from './store/installed-base';
import { MemoryObservationStore } from './store/memory-observation-store';
import type { Observation } from './domain/observation';

type DemoState = 'loading' | 'ready' | 'offline' | 'empty' | 'no-results';
type Language = 'en' | 'es';
type AppSection = 'overview' | 'capture' | 'inventory';

const DEMO_STATES: readonly { readonly label: string; readonly value: DemoState }[] = [
  { label: 'Loading', value: 'loading' },
  { label: 'Offline', value: 'offline' },
  { label: 'Empty', value: 'empty' },
  { label: 'No results', value: 'no-results' },
  { label: 'Ready', value: 'ready' },
];

const MODALITIES: readonly (Modality | null)[] = [null, 'MRI', 'CT', 'Ultrasound'];

function formatAge(age: AgeRange | null): string {
  if (age === null) return 'Unknown';
  return age.min === age.max ? `${age.min} y` : `${age.min}–${age.max} y`;
}

function formatUse(hours: number): string {
  return `${hours} h`;
}

function summarizeView(view: DashboardView) {
  const siteNames = new Set<string>();
  let equipmentRows = 0;
  for (const client of view.clients) {
    for (const site of client.sites) {
      siteNames.add(`${client.clientName}/${site.siteName}`);
      equipmentRows += site.equipment.length;
    }
  }
  return {
    clients: view.clients.length,
    sites: siteNames.size,
    rows: equipmentRows,
    units: view.aggregation?.quantity ?? 0,
  };
}

function FilterChipRow<T extends string>({
  options,
  selected,
  onSelect,
}: {
  readonly options: readonly (T | null)[];
  readonly selected: T | null;
  readonly onSelect: (value: T | null) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((value) => (
        <TouchableOpacity
          key={value ?? 'All'}
          accessibilityRole="button"
          accessibilityLabel={value === null ? 'All' : `Filter by ${value}`}
          onPress={() => onSelect(value)}
          style={[styles.chip, selected === value && styles.chipActive]}
        >
          <Text style={[styles.chipText, selected === value && styles.chipTextActive]}>{value ?? 'All'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function Metric({ label, value }: { readonly label: string; readonly value: string | number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function statusMessage(status: DashboardView['status']): { readonly title: string; readonly detail: string } {
  switch (status) {
    case 'loading':
      return { title: 'Loading', detail: 'Reading the installed base…' };
    case 'offline':
      return { title: 'Offline', detail: 'Field data is unavailable. Try again when connected.' };
    case 'empty':
      return { title: 'No installed base yet', detail: 'Capture your first Observation to get started.' };
    case 'no-results':
      return { title: 'No matching equipment', detail: 'Nothing is installed for the selected filter.' };
    case 'ready':
      return { title: 'Installed base', detail: 'Reported equipment per Client and Site.' };
  }
}

function InstalledView({ view }: { readonly view: DashboardView }) {
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const emptyEquipment = view.clients.every((client) => client.sites.length === 0);
  return (
    <View>
      {emptyEquipment && <Text style={styles.hint}>Select a filter to explore aggregation.</Text>}
        {view.clients.map((client) => (
          <View key={client.clientName} style={styles.card}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Toggle ${client.clientName}`} onPress={() => setExpandedClient(expandedClient === client.clientName ? null : client.clientName)} style={styles.cardHeader}>
            <View>
              <Text style={styles.clientEyebrow}>CLIENT</Text>
              <Text style={styles.clientTitle}>{client.clientName}</Text>
            </View>
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityValue}>{client.quantity}</Text>
              <Text style={styles.quantityLabel}>units</Text>
            </View>
            <Text style={styles.expandIcon}>{expandedClient === client.clientName ? '−' : '+'}</Text>
          </TouchableOpacity>
          {expandedClient === client.clientName && client.sites.map((site) => (
            <View key={site.siteName} style={styles.siteBlock}>
              <Text style={styles.siteTitle}>{site.siteName}</Text>
              <Text style={styles.meta}>
                {site.equipment[0]?.city !== undefined ? `${site.equipment[0].city}, ${site.equipment[0].country}` : ''}
              </Text>
              {site.equipment.map((equipment) => (
                <View key={`${site.siteName}-${equipment.modality}-${equipment.brand ?? '?'}-${equipment.model ?? '?'}`} style={styles.row}>
                  <View style={styles.rowTop}>
                    <View style={styles.modalityBadge}>
                      <Text style={styles.modality}>{equipment.modality}</Text>
                    </View>
                    <Text style={styles.rowQuantity}>×{equipment.quantity}</Text>
                  </View>
                  <Text style={styles.product}>
                    {equipment.brand ?? 'Unknown brand'} {equipment.model ?? 'Unknown model'}
                  </Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailPill}>Age {formatAge(equipment.age)}</Text>
                    <Text style={styles.detailPill}>{equipment.use === null ? 'Use unknown' : `Use ${formatUse(equipment.use.hours)}`}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function AggregationPanel({ view }: { readonly view: DashboardView }) {
  if (view.aggregation === null) return null;
  return (
    <View style={styles.aggregation}>
      <Text style={styles.sectionTitle}>Aggregation</Text>
      <Text style={styles.aggregationTotal}>Total across Clients/Sites: {view.aggregation.quantity}</Text>
      {view.aggregation.locations.map((location, index) => (
        <Text key={`${location.clientName}-${location.siteName}-${index}`} style={styles.meta}>
          {location.clientName} / {location.siteName} - {location.quantity}
        </Text>
      ))}
    </View>
  );
}

function ExtractionResult({ captured, title }: { readonly captured: readonly Observation[]; readonly title: string }) {
  if (captured.length === 0) return null;
  return (
    <View style={styles.resultPanel}>
      <View style={styles.resultPanelHeader}>
        <View><Text style={styles.panelLabel}>LATEST EXTRACTION</Text><Text style={styles.resultPanelTitle}>{title}</Text></View>
        <View style={styles.savedBadge}><View style={styles.savedDot} /><Text style={styles.savedBadgeText}>Saved locally</Text></View>
      </View>
      {captured.map((observation) => <View key={observation.id} style={styles.resultItem}>
        <Text style={styles.resultClient}>{observation.site.client.name} / {observation.site.name}</Text>
        <Text style={styles.resultLine}>{observation.quantity} x {observation.modality} · {observation.brand ?? 'Unknown brand'} · {observation.model ?? 'Unknown model'}</Text>
        <Text style={styles.resultMeta}>Age {formatAge(observation.age)} · Use {observation.use === null ? 'Unknown' : formatUse(observation.use.hours)}</Text>
      </View>)}
    </View>
  );
}

export default function App() {
  const { width } = useWindowDimensions();
  const [base, setBase] = useState<InstalledBase | null>(null);
  const [store, setStore] = useState<MemoryObservationStore | null>(null);
  const [qvacModelId, setQvacModelId] = useState<string | null>(null);
  const [fieldNote, setFieldNote] = useState('');
  const [captureState, setCaptureState] = useState<'empty' | 'loading' | 'error' | 'saved'>('empty');
  const [captureError, setCaptureError] = useState('');
  const [captured, setCaptured] = useState<readonly Observation[]>([]);
  const [demo, setDemo] = useState<DemoState>('loading');
  const [selectedModality, setSelectedModality] = useState<Modality | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [activeSection, setActiveSection] = useState<AppSection>('overview');
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentOffset = useRef(new Animated.Value(10)).current;
  const scrollRef = useRef<ScrollView>(null);
  const captureOffset = useRef(0);
  const inventoryOffset = useRef(0);

  function jumpTo(offset: number, section: AppSection) {
    setActiveSection(section);
    scrollRef.current?.scrollTo({ y: Math.max(0, offset - 18), animated: true });
  }

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      const store = new MemoryObservationStore();
      void loadSyntheticFixtures(store)
        .then((observations) => {
          if (!active) return;
          const next = new InstalledBase();
          observations.forEach((observation) => next.update(observation));
          setBase(next);
          setStore(store);
          setDemo('ready');
        })
        .catch(() => {
          if (active) setDemo('offline');
        });
    }, 500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(contentOffset, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
    ]).start();
  }, [contentOffset, contentOpacity]);

  useEffect(() => {
    let active = true;
    void loadQvacModel().then((modelId) => {
      if (active) setQvacModelId(modelId);
      else void unloadQvacModel(modelId);
    }).catch(() => {
      if (active) {
        setCaptureError('QVAC could not load its on-device model.');
        setCaptureState('error');
      }
    });
    return () => { active = false; };
  }, []);

  const view = useMemo<DashboardView>(() => {
    const source = base ?? new InstalledBase();
    switch (demo) {
      case 'loading':
        return dashboardView(source, {}, { loading: true });
      case 'offline':
        return dashboardView(source, {}, { offline: true });
      case 'empty':
        return dashboardView(new InstalledBase());
      case 'no-results':
        return dashboardView(source, { modality: 'CT', brand: 'not-installed' });
      case 'ready':
        return dashboardView(source, {
          ...(selectedModality === null ? {} : { modality: selectedModality }),
          ...(selectedBrand === null ? {} : { brand: selectedBrand }),
          ...(selectedModel === null ? {} : { model: selectedModel }),
        });
    }
  }, [demo, base, selectedModality, selectedBrand, selectedModel]);

  const brandOptions = useMemo(() => {
    const values = new Set<string>();
    for (const record of base?.all() ?? []) {
      if (record.brand !== null) values.add(record.brand);
    }
    return [...values].sort();
  }, [base]);

  const modelOptions = useMemo(() => {
    const values = new Set<string>();
    for (const record of base?.all() ?? []) {
      if (record.model !== null) values.add(record.model);
    }
    return [...values].sort();
  }, [base]);

  const status = statusMessage(view.status);
  const summary = summarizeView(view);
  const activeFilterCount = [selectedModality, selectedBrand, selectedModel].filter((value) => value !== null).length;
  const captureDisabled = store === null || qvacModelId === null || fieldNote.trim() === '';
  const compactLayout = width < 840;
  const copy = language === 'es' ? {
    kicker: 'INTELIGENCIA DE CAMPO', subtitle: 'Captura notas de campo y reconcilia la base instalada por cliente, sede y equipo.', local: 'LOCAL', note: 'NOTA DE CAMPO', capture: 'Captura de observación', processing: 'Procesando', unavailable: 'Modelo no disponible', device: 'En dispositivo', hint: 'Describe la visita en lenguaje natural. El extractor local la convierte en registros estructurados de equipos.', placeholder: 'Dos equipos de MRI en Pacific Hospital, cliente DemoCare, marca NovaMed, modelo N-1', extract: 'Extraer observación', structuring: 'Estructurando la nota de campo...', unavailableHint: 'La captura no está disponible mientras se cargan los datos locales o estás sin conexión.', saved: 'Observación guardada', installed: 'BASE INSTALADA', explore: 'EXPLORAR', clients: 'clientes', sites: 'sedes', units: 'unidades', records: 'registros', modality: 'Modalidad', brand: 'Marca', model: 'Modelo', preview: 'Estado de vista previa'
  } : {
    kicker: 'FIELD INTELLIGENCE', subtitle: 'Capture field notes and reconcile the installed base by client, site, and equipment.', local: 'LOCAL', note: 'FIELD NOTE', capture: 'Observation capture', processing: 'Processing', unavailable: 'Model unavailable', device: 'On-device', hint: 'Describe the visit in natural language. The local extractor turns it into structured equipment records.', placeholder: 'Two MRI machines at Pacific Hospital, client DemoCare, brand NovaMed, model N-1', extract: 'Extract observation', structuring: 'Structuring field note...', unavailableHint: 'Capture is unavailable while local data is loading or offline.', saved: 'Observation saved', installed: 'INSTALLED BASE', explore: 'EXPLORE', clients: 'clients', sites: 'sites', units: 'units', records: 'records', modality: 'Modality', brand: 'Brand', model: 'Model', preview: 'Preview state'
  };

  async function saveFieldNote() {
    if (store === null) return;
    setCaptureState('loading');
    setCaptureError('');
    try {
      if (qvacModelId === null) throw new Error('QVAC is still loading its on-device model.');
      const observations = await captureObservation(fieldNote, new QVACObservationExtractor(qvacModelId), store);
      const next = new InstalledBase();
      (await store.all()).forEach((item) => next.update(item));
      setBase(next);
      setCaptured(observations);
      setCaptureState('saved');
      setFieldNote('');
    } catch (error) {
      setCaptureError(error instanceof Error ? error.message : 'Could not extract this Field note.');
      setCaptureState('error');
    }
  }

  return (
    <Animated.View style={[styles.screen, { opacity: contentOpacity, transform: [{ translateY: contentOffset }] }]}>
      <View style={styles.appShell}>
        {!compactLayout && <View style={styles.rail}>
          <View style={styles.railMark}><Text style={styles.railMarkText}>C</Text></View>
          <View style={styles.railNav}>
            <TouchableOpacity onPress={() => jumpTo(0, 'overview')} style={[styles.railItem, activeSection === 'overview' && styles.railItemActive]}><Text style={styles.railIcon}>⌂</Text><Text style={activeSection === 'overview' ? styles.railItemTextActive : styles.railItemText}>Overview</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => jumpTo(captureOffset.current, 'capture')} style={[styles.railItem, activeSection === 'capture' && styles.railItemActive]}><Text style={styles.railIcon}>＋</Text><Text style={activeSection === 'capture' ? styles.railItemTextActive : styles.railItemText}>Capture</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => jumpTo(inventoryOffset.current, 'inventory')} style={[styles.railItem, activeSection === 'inventory' && styles.railItemActive]}><Text style={styles.railIcon}>▦</Text><Text style={activeSection === 'inventory' ? styles.railItemTextActive : styles.railItemText}>Inventory</Text></TouchableOpacity>
          </View>
          <View style={styles.railFooter}><View style={styles.avatar}><Text style={styles.avatarText}>Q</Text></View><Text style={styles.railFooterText}>Local workspace</Text></View>
        </View>}
        <ScrollView ref={scrollRef} style={styles.body} contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.kicker}>{copy.kicker}</Text>
            <Text style={styles.appTitle}>Caffeine Express</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
          </View>
          <View style={styles.headerActions}><View style={styles.languageToggle}>{(['en', 'es'] as const).map((value) => <TouchableOpacity key={value} onPress={() => setLanguage(value)} style={[styles.languageButton, language === value && styles.languageButtonActive]}><Text style={[styles.languageText, language === value && styles.languageTextActive]}>{value.toUpperCase()}</Text></TouchableOpacity>)}</View><View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveText}>{copy.local}</Text></View></View>
        </View>

        <View style={styles.utilityBar}><View><Text style={styles.utilityEyebrow}>WORKSPACE / OVERVIEW</Text><Text style={styles.utilityTitle}>A quiet view of your field operations</Text></View><View style={styles.syncStatus}><View style={styles.syncDot} /><Text style={styles.syncText}>Last sync just now</Text></View></View>

        <View onLayout={(event) => { captureOffset.current = event.nativeEvent.layout.y; }} style={[styles.workspace, compactLayout && styles.workspaceCompact]}>
          <View style={styles.captureCard}>
            <View style={styles.captureHeader}>
              <View>
                <Text style={styles.panelLabel}>{copy.note}</Text>
                <Text style={styles.captureTitle}>{copy.capture}</Text>
              </View>
              <Text style={styles.captureState}>{captureState === 'loading' ? copy.processing : qvacModelId === null ? copy.unavailable : copy.device}</Text>
            </View>
            <Text style={styles.captureHint}>{copy.hint}</Text>
            <TextInput
              accessibilityLabel="Field note"
              multiline
              value={fieldNote}
              onChangeText={(value) => { setFieldNote(value); if (captureState !== 'empty') setCaptureState('empty'); }}
              placeholder={copy.placeholder}
              placeholderTextColor="#7b8778"
              style={styles.input}
            />
            {captureState === 'loading' ? <View style={styles.processing}><ActivityIndicator accessibilityLabel="Extracting Field note" color="#f4b740" /><Text style={styles.processingText}>Structuring field note...</Text></View> : (
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Extract and save Field note" disabled={captureDisabled} onPress={() => void saveFieldNote()} style={[styles.primaryButton, captureDisabled && styles.buttonDisabled]}>
                <Text style={styles.primaryButtonText}>{copy.extract}</Text>
              </TouchableOpacity>
            )}
            {store === null && <Text style={styles.captureHint}>{copy.unavailableHint}</Text>}
            {captureError !== '' && <Text accessibilityRole="alert" style={styles.error}>{captureError}</Text>}
          </View>

          <View style={[styles.summaryPanel, compactLayout && styles.summaryPanelCompact]}>
            <Text style={styles.panelLabel}>{copy.installed}</Text>
            <View style={styles.metricsGrid}>
              <Metric label={copy.clients} value={summary.clients} />
              <Metric label={copy.sites} value={summary.sites} />
              <Metric label={copy.units} value={summary.units} />
              <Metric label={copy.records} value={summary.rows} />
            </View>
          </View>
        </View>

        <ExtractionResult captured={captured} title={copy.saved} />

        <View style={[styles.insightRow, compactLayout && styles.insightRowCompact]}>
          <View style={styles.insightCard}><Text style={styles.insightLabel}>COVERAGE</Text><Text style={styles.insightValue}>{summary.sites > 0 ? '100%' : '0%'}</Text><Text style={styles.insightDetail}>of active sites reporting equipment</Text></View>
          <View style={styles.insightCard}><Text style={styles.insightLabel}>MIX</Text><Text style={styles.insightValue}>{summary.rows}</Text><Text style={styles.insightDetail}>equipment records in the current view</Text></View>
          <View style={[styles.insightCard, styles.insightCardAccent]}><Text style={styles.insightLabel}>NEXT ACTION</Text><Text style={styles.insightValue}>Capture</Text><Text style={styles.insightDetail}>add a new field observation</Text></View>
        </View>

        <View onLayout={(event) => { inventoryOffset.current = event.nativeEvent.layout.y; }} style={styles.sectionIntro}>
          <View>
            <Text style={styles.panelLabel}>{copy.explore}</Text>
            <Text style={styles.dashboardTitle}>{status.title}</Text>
          </View>
          <Text style={styles.recordCount}>{view.clients.length} {copy.clients}</Text>
        </View>
        <View style={styles.exploreBar}><Text style={styles.exploreBarText}>Installed equipment</Text><Text style={styles.exploreBarDetail}>Grouped by client and site</Text></View>

        <View style={styles.controlsHeader}><Text style={styles.controlsTitle}>Filter inventory</Text><View style={styles.controlsActions}>{activeFilterCount > 0 && <Text style={styles.activeFilterCount}>{activeFilterCount} active</Text>}<TouchableOpacity accessibilityRole="button" accessibilityLabel="Clear all filters" onPress={() => { setSelectedModality(null); setSelectedBrand(null); setSelectedModel(null); }} style={[styles.clearButton, activeFilterCount === 0 && styles.clearButtonDisabled]} disabled={activeFilterCount === 0}><Text style={styles.clearButtonText}>Clear all</Text></TouchableOpacity></View></View>
        <View style={styles.controls}>
          {demo === 'ready' && (
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>{copy.modality}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroller}>
                <FilterChipRow<Modality> options={MODALITIES} selected={selectedModality} onSelect={setSelectedModality} />
              </ScrollView>
            </View>
          )}
          {demo === 'ready' && brandOptions.length > 0 && (
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>{copy.brand}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroller}>
                <FilterChipRow options={brandOptions} selected={selectedBrand} onSelect={setSelectedBrand} />
              </ScrollView>
            </View>
          )}
          {demo === 'ready' && modelOptions.length > 0 && (
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>{copy.model}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroller}>
                <FilterChipRow options={modelOptions} selected={selectedModel} onSelect={setSelectedModel} />
              </ScrollView>
            </View>
          )}
        </View>

        {view.status === 'ready' ? (
          <View>
            <Text style={styles.statusDetail}>{status.detail}</Text>
            <InstalledView view={view} />
            <AggregationPanel view={view} />
          </View>
        ) : (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>{status.title}</Text>
            <Text style={styles.stateDetail}>{status.detail}</Text>
          </View>
        )}
        <View style={styles.previewControls}>
          <Text style={styles.previewLabel}>{copy.preview}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewScroller}>
            {DEMO_STATES.map((state) => (
              <TouchableOpacity
                key={state.value}
                accessibilityRole="button"
                accessibilityLabel={`Show ${state.label} state`}
                onPress={() => setDemo(state.value)}
                style={[styles.previewChip, demo === state.value && styles.previewChipActive]}
              >
                <Text style={[styles.previewChipText, demo === state.value && styles.previewChipTextActive]}>{state.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        </ScrollView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  body: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  appShell: { flex: 1, flexDirection: 'row' },
  rail: { width: 208, backgroundColor: '#071a33', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 20, justifyContent: 'space-between' },
  railMark: { width: 38, height: 38, borderRadius: 11, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', marginBottom: 42 },
  railMarkText: { color: '#071a33', fontWeight: '900', fontSize: 22 },
  railNav: { flex: 1, gap: 7 },
  railItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 11, paddingVertical: 12, borderRadius: 8 },
  railItemActive: { backgroundColor: '#12345a' },
  railIcon: { width: 18, color: '#a7b9ce', textAlign: 'center', fontSize: 17 },
  railItemText: { color: '#a7b9ce', fontSize: 13, fontWeight: '600' },
  railItemTextActive: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  railFooter: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingTop: 18, borderTopColor: '#24405f', borderTopWidth: 1 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#b8d8ff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#071a33', fontWeight: '900' },
  railFooterText: { color: '#a7b9ce', fontSize: 11, flex: 1 },
  utilityBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomColor: '#e0e6ee', borderBottomWidth: 1, paddingBottom: 15, marginBottom: 18 },
  utilityEyebrow: { color: '#708096', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 3 },
  utilityTitle: { color: '#071a33', fontSize: 15, fontWeight: '700' },
  syncStatus: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#ffffff', borderColor: '#d9e1eb', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  syncDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#18845c' },
  syncText: { color: '#526174', fontSize: 11, fontWeight: '700' },
  exploreBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#edf3f9', borderColor: '#d9e3ef', borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 14 },
  exploreBarText: { color: '#071a33', fontSize: 12, fontWeight: '800' },
  exploreBarDetail: { color: '#63738a', fontSize: 11 },
  resultPanel: { backgroundColor: '#ffffff', borderColor: '#d9dee6', borderWidth: 1, borderRadius: 8, padding: 16, marginBottom: 16 },
  resultPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  resultPanelTitle: { color: '#071a33', fontSize: 18, fontWeight: '800' },
  savedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#edf7f1', borderColor: '#c9e8d6', borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  savedDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#18845c' },
  savedBadgeText: { color: '#176343', fontSize: 10, fontWeight: '800' },
  insightRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  insightRowCompact: { flexDirection: 'column' },
  insightCard: { flex: 1, minHeight: 112, backgroundColor: '#ffffff', borderColor: '#d9dee6', borderWidth: 1, borderRadius: 8, padding: 14 },
  insightCardAccent: { backgroundColor: '#edf3f9', borderColor: '#cbdced' },
  insightLabel: { color: '#708096', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  insightValue: { color: '#071a33', fontSize: 24, fontWeight: '900', marginBottom: 4 },
  insightDetail: { color: '#63738a', fontSize: 11, lineHeight: 15 },
  page: {
    paddingTop: 34,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 22 },
  headerText: { flex: 1 },
  kicker: { fontSize: 10, letterSpacing: 1.4, fontWeight: '800', color: '#526174', marginBottom: 5 },
  appTitle: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800',
    color: '#071a33',
    marginBottom: 4,
  },
  subtitle: {
    maxWidth: 620,
    fontSize: 14,
    lineHeight: 20,
    color: '#526174',
  },
  headerActions: { alignItems: 'flex-end', gap: 10 },
  languageToggle: { flexDirection: 'row', borderColor: '#d9dee6', borderWidth: 1, borderRadius: 7, padding: 2, backgroundColor: '#fff' },
  languageButton: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 5 },
  languageButtonActive: { backgroundColor: '#071a33' },
  languageText: { fontSize: 10, fontWeight: '800', color: '#526174' },
  languageTextActive: { color: '#fff' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: '#e9eef5', borderColor: '#d4dce7', borderWidth: 1 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#0e5a91' },
  liveText: { fontSize: 10, fontWeight: '800', color: '#0e426b', letterSpacing: 0.8 },
  workspace: { flexDirection: 'row', gap: 16, alignItems: 'stretch', marginBottom: 20 },
  workspaceCompact: { flexDirection: 'column' },
  summaryPanel: { width: 320, borderRadius: 8, padding: 16, backgroundColor: '#ffffff', borderColor: '#d9dee6', borderWidth: 1 },
  summaryPanelCompact: { width: '100%' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  metric: { width: 136, minHeight: 72, borderRadius: 6, padding: 12, backgroundColor: '#f4f7fb', borderColor: '#e0e6ee', borderWidth: 1, justifyContent: 'space-between' },
  metricValue: { fontSize: 24, lineHeight: 28, fontWeight: '800', color: '#071a33' },
  metricLabel: { fontSize: 11, color: '#526174', fontWeight: '700', textTransform: 'uppercase' },
  sectionIntro: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 12 },
  dashboardTitle: { fontSize: 24, lineHeight: 30, fontWeight: '800', color: '#071a33' },
  recordCount: { fontSize: 12, color: '#526174', marginBottom: 4 },
  controls: { gap: 10, marginBottom: 14 },
  controlsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 },
  controlsTitle: { color: '#071a33', fontSize: 13, fontWeight: '800' },
  controlsActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  activeFilterCount: { color: '#0e5a91', fontSize: 11, fontWeight: '800' },
  clearButton: { borderColor: '#b9c9dc', borderWidth: 1, borderRadius: 6, backgroundColor: '#ffffff', paddingHorizontal: 9, paddingVertical: 6 },
  clearButtonDisabled: { opacity: 0.45 },
  clearButtonText: { color: '#0e426b', fontSize: 11, fontWeight: '800' },
  filterGroup: { gap: 6 },
  filterScroller: { alignItems: 'center', paddingRight: 16 },
  filterLabel: { fontSize: 11, fontWeight: '800', color: '#526174', textTransform: 'uppercase' },
  captureHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  captureState: { color: '#f5c152', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  processing: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 },
  processingText: { color: '#f5c152', fontSize: 13, fontWeight: '700' },
  primaryButton: { backgroundColor: '#ffffff', borderRadius: 7, paddingVertical: 13, alignItems: 'center', borderColor: '#b9c9dc', borderWidth: 1 },
  buttonDisabled: { opacity: 0.45 },
  primaryButtonText: { color: '#071a33', fontSize: 14, fontWeight: '800' },
  arrow: { fontSize: 18 },
  statusDetail: { fontSize: 13, color: '#687164', marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  expandIcon: { color: '#0e5a91', fontSize: 22, fontWeight: '500', marginLeft: 10 },
  clientEyebrow: { fontSize: 9, letterSpacing: 1, color: '#7d8778', fontWeight: '800', marginBottom: 3 },
  quantityBadge: { backgroundColor: '#edf2e7', borderRadius: 6, minWidth: 62, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  quantityValue: { fontSize: 18, fontWeight: '800', color: '#0e426b' },
  quantityLabel: { fontSize: 9, color: '#687164' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowQuantity: { fontSize: 12, fontWeight: '800', color: '#0e426b' },
  detailRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 7 },
  detailPill: { fontSize: 11, color: '#687164', backgroundColor: '#f0f2ec', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 5 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 7,
    backgroundColor: '#fff',
    borderColor: '#d9d7ce',
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#071a33',
    borderColor: '#071a33',
  },
  chipText: {
    fontSize: 13,
    color: '#32372f',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#18211b',
    marginTop: 4,
    marginBottom: 8,
  },
  panelLabel: { fontSize: 10, letterSpacing: 1, fontWeight: '800', color: '#526174', marginBottom: 5 },
  captureTitle: { fontSize: 20, lineHeight: 25, fontWeight: '800', color: '#ffffff', marginBottom: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    borderColor: '#d9dee6',
    borderWidth: 1,
  },
  clientTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: '#071a33',
  },
  clientQuantity: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  siteBlock: {
    marginTop: 12,
    borderTopColor: '#ece8de',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  siteTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#071a33',
  },
  meta: {
    fontSize: 12,
    color: '#526174',
    marginBottom: 4,
  },
  row: {
    marginTop: 8,
    borderRadius: 6,
    backgroundColor: '#fbfaf6',
    borderColor: '#ece8de',
    borderWidth: 1,
    padding: 10,
  },
  modalityBadge: {
    borderRadius: 5,
    backgroundColor: '#eaf1e5',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modality: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0e426b',
  },
  product: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 19,
    color: '#222821',
    fontWeight: '600',
  },
  rowMeta: {
    fontSize: 12,
    color: '#555',
  },
  hint: {
    fontSize: 13,
    color: '#687164',
    marginBottom: 8,
  },
  aggregation: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderColor: '#dedbd2',
    borderWidth: 1,
  },
  aggregationTotal: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  stateBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    borderColor: '#dedbd2',
    borderWidth: 1,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  stateDetail: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
  },
  captureCard: {
    flex: 1,
    backgroundColor: '#071a33',
    borderRadius: 8,
    padding: 16,
    borderColor: '#071a33',
    borderWidth: 1,
  },
  captureHint: { fontSize: 12, lineHeight: 18, color: '#b8c7d8', marginBottom: 12 },
  input: {
    minHeight: 104,
    borderColor: '#3b526e',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    textAlignVertical: 'top',
    backgroundColor: '#0d2948',
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  error: { color: '#ff9b8e', marginTop: 8 },
  result: { marginTop: 12, gap: 8, backgroundColor: '#f9f7f0', borderRadius: 7, padding: 12 },
  resultTitle: { fontWeight: '800', color: '#0e426b', marginBottom: 2 },
  resultItem: { gap: 3 },
  resultClient: { fontSize: 13, fontWeight: '800', color: '#071a33' },
  resultLine: { fontSize: 13, color: '#2f342e' },
  resultMeta: { fontSize: 12, color: '#687164' },
  previewControls: { borderTopColor: '#dedbd2', borderTopWidth: 1, marginTop: 10, paddingTop: 12 },
  previewLabel: { fontSize: 11, color: '#687164', fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' },
  previewScroller: { gap: 6, paddingRight: 16 },
  previewChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#eeece4', borderColor: '#dedbd2', borderWidth: 1 },
  previewChipActive: { backgroundColor: '#071a33', borderColor: '#071a33' },
  previewChipText: { fontSize: 12, color: '#4b5048', fontWeight: '600' },
  previewChipTextActive: { color: '#ffffff' },
});
