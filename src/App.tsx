import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { dashboardView, type DashboardView } from './dashboard/dashboard';
import type { AgeRange } from './domain/age';
import type { Modality } from './domain/modality';
import { loadSyntheticFixtures } from './fixtures/seed';
import { InstalledBase } from './store/installed-base';
import { MemoryObservationStore } from './store/memory-observation-store';

type DemoState = 'loading' | 'ready' | 'offline' | 'empty' | 'no-results';

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
  const emptyEquipment = view.clients.every((client) => client.sites.length === 0);
  return (
    <View>
      {emptyEquipment && <Text style={styles.hint}>Select a filter to explore aggregation.</Text>}
      {view.clients.map((client) => (
        <View key={client.clientName} style={styles.card}>
          <Text style={styles.clientTitle}>{client.clientName}</Text>
          <Text style={styles.clientQuantity}>Total {client.quantity}</Text>
          {client.sites.map((site) => (
            <View key={site.siteName} style={styles.siteBlock}>
              <Text style={styles.siteTitle}>{site.siteName}</Text>
              <Text style={styles.meta}>
                {site.equipment[0]?.city !== undefined ? `${site.equipment[0].city}, ${site.equipment[0].country}` : ''}
              </Text>
              {site.equipment.map((equipment) => (
                <View key={`${site.siteName}-${equipment.modality}-${equipment.brand ?? '?'}-${equipment.model ?? '?'}`} style={styles.row}>
                  <Text style={styles.modality}>{equipment.modality}</Text>
                  <Text style={styles.product}>
                    {equipment.brand ?? 'Unknown brand'} {equipment.model ?? 'Unknown model'}
                  </Text>
                  <Text style={styles.rowMeta}>
                    ×{equipment.quantity} · {formatAge(equipment.age)} · {equipment.use === null ? 'Use n/a' : `Use ${formatUse(equipment.use.hours)}`}
                  </Text>
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
      {view.aggregation.locations.map((location) => (
        <Text key={`${location.clientName}-${location.siteName}`} style={styles.meta}>
          {location.clientName} / {location.siteName} — {location.quantity}
        </Text>
      ))}
    </View>
  );
}

export default function App() {
  const [base, setBase] = useState<InstalledBase | null>(null);
  const [demo, setDemo] = useState<DemoState>('loading');
  const [selectedModality, setSelectedModality] = useState<Modality | null>(null);

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
        return dashboardView(source, selectedModality === null ? {} : { modality: selectedModality });
    }
  }, [demo, base, selectedModality]);

  const status = statusMessage(view.status);

  return (
    <View style={styles.screen}>
      <Text style={styles.appTitle}>Caffeine Express</Text>
      <Text style={styles.subtitle}>Installed base dashboard (QVAC)</Text>

      <View style={styles.chipRow}>
        {DEMO_STATES.map((state) => (
          <TouchableOpacity
            key={state.value}
            accessibilityRole="button"
            accessibilityLabel={`Show ${state.label} state`}
            onPress={() => setDemo(state.value)}
            style={[styles.chip, demo === state.value && styles.chipActive]}
          >
            <Text style={[styles.chipText, demo === state.value && styles.chipTextActive]}>{state.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {demo === 'ready' && (
        <View style={styles.chipRow}>
          {MODALITIES.map((modality) => (
            <TouchableOpacity
              key={modality ?? 'All'}
              accessibilityRole="button"
              accessibilityLabel={modality === null ? 'All modalities' : `Filter by ${modality}`}
              onPress={() => setSelectedModality(modality)}
              style={[styles.chip, selectedModality === modality && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedModality === modality && styles.chipTextActive]}>
                {modality ?? 'All'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView style={styles.body}>
        {view.status === 'ready' ? (
          <View>
            <Text style={styles.sectionTitle}>{status.title}</Text>
            <InstalledView view={view} />
            <AggregationPanel view={view} />
          </View>
        ) : (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>{status.title}</Text>
            <Text style={styles.stateDetail}>{status.detail}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 64,
    paddingHorizontal: 16,
    backgroundColor: '#f7f7f7',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#555',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#1a5fb4',
    borderColor: '#1a5fb4',
  },
  chipText: {
    fontSize: 13,
    color: '#333',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  body: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderColor: '#e0e0e0',
    borderWidth: 1,
  },
  clientTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  clientQuantity: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  siteBlock: {
    marginTop: 8,
    borderTopColor: '#eee',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  siteTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  row: {
    marginTop: 6,
  },
  modality: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a5fb4',
  },
  product: {
    fontSize: 13,
  },
  rowMeta: {
    fontSize: 12,
    color: '#555',
  },
  hint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  aggregation: {
    backgroundColor: '#eef4fb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  aggregationTotal: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  stateBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    borderColor: '#e0e0e0',
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
});