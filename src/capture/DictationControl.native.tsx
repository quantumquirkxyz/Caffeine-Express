import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Mic, Square } from 'lucide-react-native';
import { requestRecordingPermissionsAsync, useAudioStream } from 'expo-audio';
import { radius, spacing, typography, useTheme } from '../ui/tokens';

export type DictationProcessingState = 'idle' | 'transcribing' | 'cleaning' | 'ready' | 'error';

type Props = {
  readonly processingState: DictationProcessingState;
  readonly disabled?: boolean;
  readonly error?: string;
  readonly onAudio: (audio: Int16Array) => Promise<void> | void;
};

function concat(chunks: readonly Int16Array[]): Int16Array {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Int16Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

function resamplePcm16(input: Int16Array, fromRate: number, toRate = 16_000): Int16Array {
  if (fromRate === toRate || input.length === 0) return input;
  const ratio = fromRate / toRate;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Int16Array(outputLength);
  for (let i = 0; i < outputLength; i += 1) {
    const source = i * ratio;
    const left = Math.floor(source);
    const right = Math.min(left + 1, input.length - 1);
    const fraction = source - left;
    const leftSample = input[left] ?? 0;
    const rightSample = input[right] ?? leftSample;
    output[i] = Math.round(leftSample * (1 - fraction) + rightSample * fraction);
  }
  return output;
}

export function DictationControl({ processingState, disabled = false, error, onAudio }: Props) {
  const { colors } = useTheme();
  const chunks = useRef<Int16Array[]>([]);
  const sourceRate = useRef(16_000);
  const [captureError, setCaptureError] = useState('');
  const { stream, isStreaming } = useAudioStream({
    channels: 1,
    sampleRate: 16_000,
    encoding: 'int16',
    onBuffer(buffer) {
      sourceRate.current = buffer.sampleRate;
      chunks.current.push(new Int16Array(buffer.data.slice(0)));
    },
  });

  const busy = processingState === 'transcribing' || processingState === 'cleaning';

  async function toggleRecording() {
    setCaptureError('');
    if (isStreaming) {
      stream.stop();
      const pcm = resamplePcm16(concat(chunks.current), sourceRate.current);
      if (pcm.length < 16_000) {
        setCaptureError('La grabación fue demasiado corta. Intenta hablar durante al menos un segundo.');
        return;
      }
      await onAudio(pcm);
      return;
    }

    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setCaptureError('Se necesita permiso de micrófono para dictar una observación.');
      return;
    }
    chunks.current = [];
    sourceRate.current = 16_000;
    await stream.start();
  }

  const label = isStreaming
    ? 'Detener y transcribir'
    : processingState === 'transcribing'
      ? 'Transcribiendo con Parakeet…'
      : processingState === 'cleaning'
        ? 'Ordenando con QVAC…'
        : 'Dictar observación';

  return (
    <View style={{ gap: spacing.sm }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled || busy}
        onPress={() => void toggleRecording()}
        style={({ pressed }) => ({
          minHeight: 58,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: isStreaming ? colors.danger : colors.primary,
          backgroundColor: isStreaming ? colors.surfaceMuted : colors.primarySoft,
          paddingHorizontal: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          opacity: disabled || busy ? 0.55 : pressed ? 0.82 : 1,
        })}
      >
        {busy ? (
          <ActivityIndicator color={colors.primary} />
        ) : isStreaming ? (
          <Square size={18} color={colors.danger} fill={colors.danger} />
        ) : (
          <Mic size={20} color={colors.primary} />
        )}
        <Text style={{ color: isStreaming ? colors.danger : colors.primary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold }}>
          {label}
        </Text>
      </Pressable>
      {isStreaming ? (
        <Text style={{ color: colors.danger, fontSize: typography.sizes.xs, textAlign: 'center' }}>Grabando · el audio permanece en este dispositivo</Text>
      ) : null}
      {(captureError || error) ? (
        <Text accessibilityRole="alert" style={{ color: colors.danger, fontSize: typography.sizes.xs }}>{captureError || error}</Text>
      ) : null}
    </View>
  );
}
