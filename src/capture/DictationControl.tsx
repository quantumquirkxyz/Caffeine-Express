import { Text, View } from 'react-native';
import { MicOff } from 'lucide-react-native';
import { Card } from '../ui/components/Card';
import { spacing, typography, useTheme } from '../ui/tokens';

export type DictationProcessingState = 'idle' | 'transcribing' | 'cleaning' | 'ready' | 'error';

type Props = {
  readonly processingState: DictationProcessingState;
  readonly disabled?: boolean;
  readonly error?: string;
  readonly onAudio: (audio: Int16Array) => Promise<void> | void;
};

export function DictationControl(_props: Props) {
  const { colors } = useTheme();
  return (
    <Card style={{ backgroundColor: colors.surfaceMuted }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <MicOff size={20} color={colors.textSecondary} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold }}>Dictado QVAC disponible en móvil</Text>
          <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, marginTop: spacing.xs }}>
            La transcripción y el reordenamiento requieren un dispositivo físico Android o iOS. La web mantiene el dashboard y la revisión de datos.
          </Text>
        </View>
      </View>
    </Card>
  );
}
