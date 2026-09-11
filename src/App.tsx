import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, ScrollView } from 'react-native';
import { normalizeFieldNote } from './capture/field-note-normalizer';
import { captureObservation, DeterministicObservationExtractor } from './capture/observation-capture';
import { QVACObservationExtractor } from './capture/qvac-extractor';
import { loadQvacModel, unloadQvacModel } from './capture/qvac-runtime';
import { transcribeFieldAudio } from './capture/qvac-transcription';
import type { DictationProcessingState } from './capture/DictationControl';
import { dashboardView, overviewAggregation, type DashboardStatus, type DashboardView } from './dashboard/dashboard';
import type { Modality } from './domain/modality';
import type { Observation } from './domain/observation';
import { loadSyntheticFixtures } from './fixtures/seed';
import { AppShell } from './layout/AppShell';
import type { AppSection } from './layout/DesktopSidebar';
import { CaptureScreen } from './screens/CaptureScreen';
import { InstalledBaseScreen } from './screens/InstalledBaseScreen';
import { OverviewScreen } from './screens/OverviewScreen';
import { InstalledBase } from './store/installed-base';
import { AsyncObservationStore } from './store/async-observation-store';
import { COPY } from './i18n/copy';
import { loadPreferences, savePreferences, type Language } from './preferences';
import { ThemeProvider } from './ui/ThemeProvider';
import type { ThemeMode } from './ui/palette';

type DemoState = DashboardStatus;
const MODALITIES: readonly (Modality | null)[] = [null, 'MRI', 'CT', 'Ultrasound'];
function statusFor(status: DashboardView['status']) { return { loading: ['Loading', 'Reading the installed base…'], offline: ['Offline', 'Field data is unavailable. Try again when connected.'], empty: ['No installed base yet', 'Capture your first Observation to get started.'], 'no-results': ['No matching equipment', 'Nothing is installed for the selected filter.'], ready: ['Installed base', 'Reported equipment per Client and Site.'] }[status] as [string, string]; }

export default function App() {
  const [base, setBase] = useState<InstalledBase | null>(null); const [store, setStore] = useState<AsyncObservationStore | null>(null); const [qvacModelId, setQvacModelId] = useState<string | null>(null); const [qvacState, setQvacState] = useState<'web' | 'loading' | 'ready' | 'error'>(Platform.OS === 'web' ? 'web' : 'loading'); const [fieldNote, setFieldNote] = useState(''); const [captureState, setCaptureState] = useState<'empty' | 'loading' | 'error' | 'saved'>('empty'); const [captureError, setCaptureError] = useState(''); const [dictationState, setDictationState] = useState<DictationProcessingState>('idle'); const [dictationError, setDictationError] = useState(''); const [rawTranscript, setRawTranscript] = useState(''); const [captured, setCaptured] = useState<readonly Observation[]>([]); const [demo, setDemo] = useState<DemoState>('loading'); const [selectedModality, setSelectedModality] = useState<Modality | null>(null); const [selectedBrand, setSelectedBrand] = useState<string | null>(null); const [selectedModel, setSelectedModel] = useState<string | null>(null); const [selectedCountry, setSelectedCountry] = useState<string | null>(null); const [selectedClient, setSelectedClient] = useState<string | null>(null); const [selectedSite, setSelectedSite] = useState<string | null>(null); const [language, setLanguage] = useState<Language>('en'); const [themeMode, setThemeMode] = useState<ThemeMode>('system'); const [activeSection, setActiveSection] = useState<AppSection>('overview'); const opacity = useRef(new Animated.Value(1)).current; const offset = useRef(new Animated.Value(0)).current; const scrollRef = useRef<ScrollView>(null);
  useEffect(() => { void loadPreferences().then(preferences => { setLanguage(preferences.language); setThemeMode(preferences.themeMode); }); }, []);
  useEffect(() => { void savePreferences({ language, themeMode }); }, [language, themeMode]);
  useEffect(() => { let active = true; const timer = setTimeout(() => { const nextStore = new AsyncObservationStore(); void loadSyntheticFixtures(nextStore).catch(error => { if (error?.name !== 'ObservationAlreadyPersistedError') throw error; }).then(async () => { if (!active) return; const nextBase = new InstalledBase(); (await nextStore.all()).forEach(observation => nextBase.update(observation)); setBase(nextBase); setStore(nextStore); setDemo('ready'); }).catch(() => { if (active) setDemo('offline'); }); }, 500); return () => { active = false; clearTimeout(timer); }; }, []);
  useEffect(() => {
     if (Platform.OS === 'web') { setQvacModelId('web-fallback'); setQvacState('web'); return undefined; }
    let active = true;
    setQvacState('loading');
    void loadQvacModel().then(id => {
      if (active) { setQvacModelId(id); setQvacState('ready'); }
      else void unloadQvacModel(id);
    }).catch(error => {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[QVAC] model load failed:', error);
      if (active) { setQvacState('error'); setCaptureError(`QVAC could not load its on-device model: ${message}`); }
    });
    return () => { active = false; };
  }, []);
  const view = useMemo(() => { const source = base ?? new InstalledBase(); if (demo === 'loading') return dashboardView(source, {}, { loading: true }); if (demo === 'offline') return dashboardView(source, {}, { offline: true }); if (demo === 'empty') return dashboardView(new InstalledBase()); if (demo === 'no-results') return dashboardView(source, { modality: 'CT', brand: 'not-installed' }); return dashboardView(source, { ...(selectedCountry === null ? {} : { country: selectedCountry }), ...(selectedClient === null ? {} : { clientName: selectedClient }), ...(selectedSite === null ? {} : { siteName: selectedSite }), ...(selectedModality === null ? {} : { modality: selectedModality }), ...(selectedBrand === null ? {} : { brand: selectedBrand }), ...(selectedModel === null ? {} : { model: selectedModel }) }); }, [base, demo, selectedBrand, selectedClient, selectedCountry, selectedModel, selectedModality, selectedSite]);
  const copy = COPY[language]; const source = base ?? new InstalledBase(); const aggregation = overviewAggregation(source); const [statusTitle, statusDetail] = statusFor(view.status); const brandOptions = useMemo(() => [...new Set((base?.all() ?? []).flatMap(record => record.brand === null ? [] : [record.brand]))].sort(), [base]); const modelOptions = useMemo(() => [...new Set((base?.all() ?? []).flatMap(record => record.model === null ? [] : [record.model]))].sort(), [base]);
  async function processDictation(audio: Int16Array) {
    setDictationError(''); setRawTranscript('');
    try {
      if (qvacModelId === null) throw new Error('The QVAC model is not ready yet.');
      setDictationState('transcribing');
      const transcript = await transcribeFieldAudio(audio);
      if (transcript.trim() === '') throw new Error('No usable speech was detected in the recording.');
      setRawTranscript(transcript);
      setFieldNote(transcript);
      setCaptureState('empty');
      setDictationState('cleaning');
      const cleaned = await normalizeFieldNote(qvacModelId, transcript);
      setFieldNote(cleaned.trim() || transcript);
      setDictationState('ready');
    } catch (error) {
      setDictationError(error instanceof Error ? error.message : 'Local dictation could not be processed.');
      setDictationState('error');
    }
  }
   async function saveFieldNote() { if (store === null) return; setCaptureState('loading'); setCaptureError(''); try { if (qvacModelId === null) throw new Error('QVAC is still loading its on-device model.'); const extractor = Platform.OS === 'web' ? new DeterministicObservationExtractor() : new QVACObservationExtractor(qvacModelId); const observations = await captureObservation(fieldNote, extractor, store); const next = new InstalledBase(); (await store.all()).forEach(item => next.update(item)); setBase(next); setCaptured(observations); setCaptureState('saved'); setFieldNote(''); setRawTranscript(''); setDictationState('idle'); } catch (error) { setCaptureError(error instanceof Error ? error.message : 'Could not extract this Field note.'); setCaptureState('error'); } }
  function navigate(section: AppSection) { setActiveSection(section); scrollRef.current?.scrollTo({ y: 0, animated: false }); }
  const rows = base?.all() ?? [];
  const countryOptions = [...new Set(rows.map(record => record.site.country))].sort(); const clientOptions = [...new Set(rows.map(record => record.site.client.name))].sort(); const siteOptions = [...new Set(rows.map(record => record.site.name))].sort();
  const captureProps = { copy, fieldNote, setFieldNote: (value: string) => { setFieldNote(value); if (captureState !== 'empty') setCaptureState('empty'); }, captureState, captureDisabled: store === null || qvacModelId === null || fieldNote.trim() === '', captureError, onSave: () => void saveFieldNote(), captured, qvacState, dictationState, dictationError, rawTranscript, onAudio: processDictation, onTranscript: (text: string) => { setFieldNote(text); setRawTranscript(text); setCaptureState('empty'); } };
  Object.assign(captureProps, { language });
  const screen = activeSection === 'overview'
    ? <OverviewScreen copy={copy} aggregation={aggregation} />
    : activeSection === 'capture'
      ? <CaptureScreen {...captureProps} />
      : <InstalledBaseScreen view={view} status={{ title: statusTitle, detail: statusDetail }} copy={copy} demo={demo} modalities={MODALITIES} selectedModality={selectedModality} onModality={value => setSelectedModality(value as Modality | null)} brandOptions={brandOptions} selectedBrand={selectedBrand} onBrand={setSelectedBrand} modelOptions={modelOptions} selectedModel={selectedModel} onModel={setSelectedModel} countryOptions={countryOptions} selectedCountry={selectedCountry} onCountry={setSelectedCountry} clientOptions={clientOptions} selectedClient={selectedClient} onClient={setSelectedClient} siteOptions={siteOptions} selectedSite={selectedSite} onSite={setSelectedSite} onClear={() => { setSelectedCountry(null); setSelectedClient(null); setSelectedSite(null); setSelectedModality(null); setSelectedBrand(null); setSelectedModel(null); }} />;
  return <ThemeProvider key={themeMode} initialMode={themeMode} onModeChange={setThemeMode}><AppShell activeSection={activeSection} onNavigate={navigate} scrollRef={scrollRef} opacity={opacity} offset={offset} language={language} onLanguage={setLanguage}>{screen}</AppShell></ThemeProvider>;
}
