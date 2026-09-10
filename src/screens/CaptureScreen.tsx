import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import type { Observation } from '../domain/observation';
import { Badge } from '../ui/components/Badge';
import { Button } from '../ui/components/Button';
import { Card } from '../ui/components/Card';
import { SectionHeader } from '../ui/components/SectionHeader';
import { StatusBadge } from '../ui/components/StatusBadge';
import { radius, spacing, typography, useTheme } from '../ui/tokens';

type Copy = { readonly placeholder: string; readonly extract: string; readonly processing: string; readonly saved: string };
type Props = { readonly copy: Copy; readonly fieldNote: string; readonly setFieldNote: (value: string) => void; readonly captureState: 'empty' | 'loading' | 'error' | 'saved'; readonly captureDisabled: boolean; readonly captureError: string; readonly onSave: () => void; readonly captured: readonly Observation[] };

export function CaptureScreen({ copy, fieldNote, setFieldNote, captureState, captureDisabled, captureError, onSave, captured }: Props) {
  const { colors } = useTheme();
  return (
    <View style={{ width: '100%', maxWidth: 720, alignSelf: 'center' }}>
      <View style={{ marginBottom: spacing.xl }}><Text style={{ color: colors.primary, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, letterSpacing: 1.2 }}>CAPTURA</Text><Text style={{ color: colors.text, fontSize: typography.sizes.display, fontWeight: typography.weights.bold, marginTop: spacing.sm }}>Nueva observación</Text><Text style={{ color: colors.textSecondary, fontSize: typography.sizes.md, marginTop: spacing.xs }}>Escribe lo observado durante la Visit. QVAC lo estructura localmente.</Text></View>
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Field note" subtitle="Describe el equipo en lenguaje natural." />
        <TextInput accessibilityLabel="Field note" multiline value={fieldNote} onChangeText={setFieldNote} placeholder={copy.placeholder} placeholderTextColor={colors.textMuted} style={{ minHeight: 180, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.lg, textAlignVertical: 'top', backgroundColor: colors.surfaceMuted, color: colors.text, fontSize: typography.sizes.md, lineHeight: 22 }} />
        <View style={{ marginTop: spacing.lg }}>{captureState === 'loading' ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.textSecondary }}>{copy.processing}</Text></View> : <Button disabled={captureDisabled} onPress={onSave}>{copy.extract}</Button>}</View>
        {captureState === 'error' && <Text accessibilityRole="alert" style={{ color: colors.danger, marginTop: spacing.md }}>{captureError}</Text>}
      </Card>
      {captureState === 'saved' && captured.length > 0 && <Card><SectionHeader title={copy.saved} subtitle="Observation persistida y enviada a la base instalada." />{captured.map((observation) => <View key={observation.id} style={{ paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}><Text style={{ flex: 1, color: colors.text, fontWeight: typography.weights.semibold }}>{observation.site.client.name} · {observation.site.name}</Text><StatusBadge status={observation.ageProvenance.toLowerCase() as 'confirmed' | 'reported' | 'estimated' | 'unknown'} /></View><Text style={{ color: colors.textSecondary, marginTop: spacing.xs }}>{observation.quantity} x {observation.modality} · {observation.brand ?? 'Unknown brand'} · {observation.model ?? 'Unknown model'}</Text><Badge tone={observation.age === null ? 'neutral' : 'blue'}>{observation.age === null ? 'Age: Unknown' : `Age: ${observation.age.min}-${observation.age.max} years`}</Badge></View>)}</Card>}
    </View>
  );
}
