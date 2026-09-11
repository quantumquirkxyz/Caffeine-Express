import { Text, View } from 'react-native';
import { MicOff } from 'lucide-react-native';
import { Card } from '../ui/components/Card';
import { radius, spacing, typography, useTheme } from '../ui/tokens';

export type DictationProcessingState = 'idle' | 'transcribing' | 'cleaning' | 'ready' | 'error';

type Props = {
  readonly processingState: DictationProcessingState;
  readonly disabled?: boolean;
  readonly error?: string;
  readonly compact?: boolean;
  readonly onAudio: (audio: Int16Array) => Promise<void> | void;
};

export function DictationControl({ compact = false }: Props) {
  const { colors } = useTheme();
  if (compact) {
    return (
      <View style={{ minHeight: 46, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surfaceMuted, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, opacity: 0.72 }}>
        <MicOff size={17} color={colors.textSecondary} />
        <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold }}>Mobile dictation</Text>
      </View>
    );
  }
  return (
    <Card style={{ backgroundColor: colors.surfaceMuted }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <MicOff size={20} color={colors.textSecondary} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold }}>QVAC dictation is available on mobile</Text>
          <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, marginTop: spacing.xs }}>
            Transcription and note organization require a physical Android or iOS device. The web build remains a dashboard and data-review surface.
          </Text>
        </View>
      </View>
    </Card>
  );
}
