import { Mic, MicOff } from 'lucide-react-native';
import { Pressable, Text } from 'react-native';
import { radius, spacing, typography, useTheme } from '../ui/tokens';
import type { DictationProcessingState } from './DictationControl';

type Props = {
  readonly processingState: DictationProcessingState;
  readonly disabled?: boolean;
  readonly error?: string;
  readonly compact?: boolean;
  readonly onAudio: (audio: Int16Array) => Promise<void> | void;
  readonly onTranscript?: ((text: string) => void) | undefined;
  readonly language?: 'en' | 'es' | 'pt' | undefined;
};

type Recognition = { lang: string; interimResults: boolean; continuous: boolean; onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onerror: () => void; onend: () => void; start: () => void; stop: () => void };
type RecognitionConstructor = new () => Recognition;

export function DictationControl({ disabled, processingState, onTranscript, language = 'en' }: Props) {
  const { colors } = useTheme();
  const showAlert = (message: string) => (globalThis as typeof globalThis & { alert?: (value: string) => void }).alert?.(message);
  const recording = processingState === 'transcribing';
  function toggle() {
    const browser = globalThis as typeof globalThis & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Constructor) { showAlert('Este navegador no admite dictado web. Usa Chrome o Edge y permite el acceso al micrófono.'); return; }
    const recognition = new Constructor();
    recognition.lang = language === 'es' ? 'es-ES' : language === 'pt' ? 'pt-BR' : 'en-US'; recognition.interimResults = false; recognition.continuous = true;
    recognition.onresult = event => { const text = Array.from(event.results).map(result => result[0]?.transcript ?? '').join(' ').trim(); if (text) onTranscript?.(text); };
    recognition.onerror = () => showAlert('No se pudo usar el micrófono. Verifica los permisos del navegador y vuelve a intentarlo.');
    recognition.onend = () => undefined;
    recognition.start();
  }
  return <Pressable accessibilityRole="button" accessibilityLabel="Dictate field note" disabled={disabled || recording} onPress={toggle} style={{ minHeight: 46, minWidth: 150, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surfaceMuted, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, opacity: disabled ? 0.55 : 1 }}><>{recording ? <MicOff size={17} color={colors.primary} /> : <Mic size={17} color={colors.primary} />}<Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold }}>{recording ? 'Listening…' : 'Web dictation'}</Text></></Pressable>;
}
