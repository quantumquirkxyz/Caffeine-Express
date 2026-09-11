import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { Check, Cpu, LockKeyhole, Mic, Sparkles } from 'lucide-react-native';
import { DictationControl, type DictationProcessingState } from '../capture/DictationControl';
import type { Observation } from '../domain/observation';
import { Badge } from '../ui/components/Badge';
import { Button } from '../ui/components/Button';
import { Card } from '../ui/components/Card';
import { SectionHeader } from '../ui/components/SectionHeader';
import { StatusBadge } from '../ui/components/StatusBadge';
import { radius, spacing, typography, useTheme } from '../ui/tokens';

type Copy = { readonly placeholder: string; readonly extract: string; readonly processing: string; readonly saved: string };
type Props = {
  readonly copy: Copy;
  readonly fieldNote: string;
  readonly setFieldNote: (value: string) => void;
  readonly captureState: 'empty' | 'loading' | 'error' | 'saved';
  readonly captureDisabled: boolean;
  readonly captureError: string;
  readonly onSave: () => void;
  readonly captured: readonly Observation[];
  readonly qvacState: 'web' | 'loading' | 'ready' | 'error';
  readonly dictationState: DictationProcessingState;
  readonly dictationError: string;
  readonly rawTranscript: string;
  readonly onAudio: (audio: Int16Array) => Promise<void> | void;
};

function PipelineStep({ label, detail, active = false }: { readonly label: string; readonly detail: string; readonly active?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, minWidth: 145, padding: spacing.md, borderRadius: radius.md, backgroundColor: active ? colors.primarySoft : colors.surfaceMuted, borderWidth: 1, borderColor: active ? colors.primary : colors.border }}>
      <Text style={{ color: active ? colors.primary : colors.text, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold }}>{label}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, marginTop: spacing.xs }}>{detail}</Text>
    </View>
  );
}

export function CaptureScreen({ copy, fieldNote, setFieldNote, captureState, captureDisabled, captureError, onSave, captured, qvacState, dictationState, dictationError, rawTranscript, onAudio }: Props) {
  const { colors } = useTheme();
  const qvacReady = qvacState === 'ready';
  return (
    <View style={{ width: '100%', maxWidth: 920, alignSelf: 'center' }}>
      <View style={{ marginBottom: spacing.xl }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' }}>
          <Text style={{ color: colors.primary, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, letterSpacing: 1.2 }}>CAPTURE AT THE EDGE</Text>
          <Badge tone="blue">QVAC · LOCAL AI</Badge>
        </View>
        <Text style={{ color: colors.text, fontSize: typography.sizes.display, fontWeight: typography.weights.bold, marginTop: spacing.sm }}>De una conversación a datos confiables</Text>
        <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.md, marginTop: spacing.xs, maxWidth: 720, lineHeight: 23 }}>
          Dicta o escribe lo observado. FieldSight transcribe, ordena y extrae la información en el dispositivo antes de actualizar la base instalada.
        </Text>
      </View>

      <Card style={{ marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}><Cpu size={19} color={colors.primary} /></View>
            <View>
              <Text style={{ color: colors.text, fontWeight: typography.weights.semibold }}>Motor QVAC</Text>
              <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs }}>
                {qvacState === 'ready' ? 'Modelo local listo para inferencia' : qvacState === 'loading' ? 'Cargando modelo local…' : qvacState === 'web' ? 'Dashboard web · inferencia disponible en móvil' : 'El runtime local requiere atención'}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}><LockKeyhole size={15} color={colors.primary} /><Text style={{ color: colors.primary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold }}>Sin inferencia cloud</Text></View>
        </View>
      </Card>

      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="1. Dicta la observación" subtitle="Habla naturalmente. La transcripción multilingüe se ejecuta con QVAC Parakeet TDT en el dispositivo." />
        <DictationControl processingState={dictationState} disabled={!qvacReady} error={dictationError} onAudio={onAudio} />
        {rawTranscript ? (
          <View style={{ marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}><Mic size={14} color={colors.textSecondary} /><Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold }}>TRANSCRIPCIÓN ORIGINAL</Text></View>
            <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm, marginTop: spacing.sm, lineHeight: 20 }}>{rawTranscript}</Text>
          </View>
        ) : null}
      </Card>

      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="2. Revisa la Field note" subtitle="QVAC elimina muletillas y mejora el orden sin inventar hechos. Puedes editar el resultado antes de extraer." />
        <TextInput accessibilityLabel="Field note" multiline value={fieldNote} onChangeText={setFieldNote} placeholder={copy.placeholder} placeholderTextColor={colors.textMuted} style={{ minHeight: 180, borderWidth: 1, borderColor: fieldNote ? colors.primary : colors.border, borderRadius: radius.md, padding: spacing.lg, textAlignVertical: 'top', backgroundColor: colors.surfaceMuted, color: colors.text, fontSize: typography.sizes.md, lineHeight: 23 }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }}>
          <PipelineStep label="CAPTURE" detail="Voz o texto" active={dictationState === 'idle'} />
          <PipelineStep label="TRANSCRIBE" detail="Parakeet TDT" active={dictationState === 'transcribing'} />
          <PipelineStep label="CLEAN" detail="QVAC LLM" active={dictationState === 'cleaning' || dictationState === 'ready'} />
          <PipelineStep label="EXTRACT" detail="JSON validado" active={captureState === 'loading' || captureState === 'saved'} />
        </View>
        <View style={{ marginTop: spacing.lg }}>
          {captureState === 'loading' ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.textSecondary }}>{copy.processing}</Text></View> : <Button disabled={captureDisabled} onPress={onSave}>{copy.extract}</Button>}
        </View>
        {captureState === 'error' && <Text accessibilityRole="alert" style={{ color: colors.danger, marginTop: spacing.md }}>{captureError}</Text>}
      </Card>

      {captureState === 'saved' && captured.length > 0 && <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}><View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}><Check size={18} color={colors.primary} /></View><View style={{ flex: 1 }}><SectionHeader title={copy.saved} subtitle="Observation persistida y reconciliada con la base instalada." /></View></View>
        {captured.map((observation) => <View key={observation.id} style={{ paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}><Text style={{ flex: 1, color: colors.text, fontWeight: typography.weights.semibold }}>{observation.site.client.name} · {observation.site.name}</Text><StatusBadge status={observation.ageProvenance.toLowerCase() as 'confirmed' | 'reported' | 'estimated' | 'unknown'} /></View><Text style={{ color: colors.textSecondary, marginTop: spacing.xs }}>{observation.quantity} × {observation.modality} · {observation.brand ?? 'Unknown brand'} · {observation.model ?? 'Unknown model'}</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm }}><Sparkles size={13} color={colors.primary} /><Badge tone={observation.age === null ? 'neutral' : 'blue'}>{observation.age === null ? 'Age: Unknown' : `Age: ${observation.age.min}-${observation.age.max} years`}</Badge></View></View>)}
      </Card>}
    </View>
  );
}
