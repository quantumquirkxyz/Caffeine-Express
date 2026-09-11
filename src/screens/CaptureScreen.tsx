import { ActivityIndicator, Text, TextInput, View, useWindowDimensions } from 'react-native';
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

function PipelineState({ label, active, done }: { readonly label: string; readonly active?: boolean; readonly done?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: done ? colors.success : active ? colors.primary : colors.borderStrong }} />
      <Text style={{ color: active || done ? colors.text : colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: active ? typography.weights.semibold : undefined }}>{label}</Text>
    </View>
  );
}

export function CaptureScreen({ copy, fieldNote, setFieldNote, captureState, captureDisabled, captureError, onSave, captured, qvacState, dictationState, dictationError, rawTranscript, onAudio }: Props) {
  const { colors } = useTheme();
  const compact = useWindowDimensions().width < 660;
  const qvacReady = qvacState === 'ready';
  const dictationBusy = dictationState === 'transcribing' || dictationState === 'cleaning';

  return (
    <View style={{ width: '100%', maxWidth: 980, alignSelf: 'center' }}>
      <View style={{ marginBottom: spacing.xl }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' }}>
          <Text style={{ color: colors.primary, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, letterSpacing: 1.2 }}>CAPTURE AT THE EDGE</Text>
          <Badge tone="blue">QVAC · LOCAL AI</Badge>
        </View>
        <Text style={{ color: colors.text, fontSize: compact ? 34 : typography.sizes.display, lineHeight: compact ? 40 : undefined, fontWeight: typography.weights.bold, marginTop: spacing.sm }}>Describe what you saw. FieldSite does the rest.</Text>
        <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.md, marginTop: spacing.xs, maxWidth: 760, lineHeight: 23 }}>
          Type or dictate in natural language. QVAC transcribes, organizes, structures, and validates the observation without sending inference to the cloud.
        </Text>
      </View>

      <Card style={{ marginBottom: spacing.lg }}>
        <View style={{ flexDirection: compact ? 'column' : 'row', gap: spacing.md, alignItems: compact ? 'stretch' : 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}><Cpu size={19} color={colors.primary} /></View>
            <View>
              <Text style={{ color: colors.text, fontWeight: typography.weights.semibold }}>QVAC engine</Text>
              <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs }}>
                {qvacState === 'ready' ? 'Ready to transcribe and extract' : qvacState === 'loading' ? 'Loading local model…' : qvacState === 'web' ? 'Web view · inference is available on mobile' : 'The local runtime requires attention'}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}><LockKeyhole size={15} color={colors.primary} /><Text style={{ color: colors.primary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold }}>No cloud inference</Text></View>
        </View>

        <View style={{ borderWidth: 1, borderColor: fieldNote ? colors.primary : colors.borderStrong, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted, overflow: 'hidden' }}>
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
            <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, letterSpacing: 0.7 }}>FIELD NOTE</Text>
          </View>
          <TextInput
            accessibilityLabel="Field note"
            multiline
            value={fieldNote}
            onChangeText={setFieldNote}
            placeholder={copy.placeholder}
            placeholderTextColor={colors.textMuted}
            style={{ minHeight: 190, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg, textAlignVertical: 'top', backgroundColor: 'transparent', color: colors.text, fontSize: typography.sizes.md, lineHeight: 24 }}
          />
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, flexDirection: compact ? 'column' : 'row', gap: spacing.sm, alignItems: compact ? 'stretch' : 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, alignItems: 'center' }}>
              <PipelineState label="Voice / text" done={fieldNote.trim().length > 0 || rawTranscript.length > 0} />
              <PipelineState label="Transcribe" active={dictationState === 'transcribing'} done={rawTranscript.length > 0} />
              <PipelineState label="Organize" active={dictationState === 'cleaning'} done={dictationState === 'ready'} />
              <PipelineState label="Extract" active={captureState === 'loading'} done={captureState === 'saved'} />
            </View>
            <View style={{ flexDirection: compact ? 'column' : 'row', gap: spacing.sm, alignItems: 'stretch' }}>
              <DictationControl compact processingState={dictationState} disabled={!qvacReady} error={dictationError} onAudio={onAudio} />
              {captureState === 'loading' ? (
                <View style={{ minHeight: 46, minWidth: 150, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.primarySoft }}><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.primary }}>{copy.processing}</Text></View>
              ) : (
                <Button disabled={captureDisabled || dictationBusy} onPress={onSave}>Process with AI</Button>
              )}
            </View>
          </View>
        </View>

        {rawTranscript ? (
          <View style={{ marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}><Mic size={14} color={colors.primary} /><Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, letterSpacing: 0.6 }}>DICTATION TRANSCRIPT</Text></View>
            <Text style={{ color: colors.text, fontSize: typography.sizes.sm, marginTop: spacing.sm, lineHeight: 21 }}>{rawTranscript}</Text>
            {dictationState === 'cleaning' ? <Text style={{ color: colors.primary, fontSize: typography.sizes.xs, marginTop: spacing.sm }}>QVAC is organizing the text without changing the facts…</Text> : <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, marginTop: spacing.sm }}>Compare this transcript with the editable Field note before saving.</Text>}
          </View>
        ) : null}

        {captureState === 'error' ? <Text accessibilityRole="alert" style={{ color: colors.danger, marginTop: spacing.md }}>{captureError}</Text> : null}
      </Card>

      {captureState === 'saved' && captured.length > 0 ? (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}><Check size={18} color={colors.primary} /></View>
            <View style={{ flex: 1 }}><SectionHeader title={copy.saved} subtitle="Observation persisted and reconciled with the installed base." /></View>
          </View>
          {captured.map((observation) => (
            <View key={observation.id} style={{ paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
                <Text style={{ flex: 1, color: colors.text, fontWeight: typography.weights.semibold }}>{observation.site.client.name} · {observation.site.name}</Text>
                <StatusBadge status={observation.ageProvenance.toLowerCase() as 'confirmed' | 'reported' | 'estimated' | 'unknown'} />
              </View>
              <Text style={{ color: colors.textSecondary, marginTop: spacing.xs }}>{observation.quantity} × {observation.modality} · {observation.brand ?? 'Unknown brand'} · {observation.model ?? 'Unknown model'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm }}><Sparkles size={13} color={colors.primary} /><Badge tone={observation.age === null ? 'neutral' : 'blue'}>{observation.age === null ? 'Age: Unknown' : `Age: ${observation.age.min}-${observation.age.max} years`}</Badge></View>
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  );
}
