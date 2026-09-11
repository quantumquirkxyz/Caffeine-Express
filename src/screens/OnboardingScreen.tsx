import { useRef, useState } from 'react';
import { Animated, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { ArrowRight, DatabaseZap, Mic2, ShieldCheck } from 'lucide-react-native';
import { Button } from '../ui/components/Button';
import { radius, spacing, typography, useTheme } from '../ui/tokens';

type Slide = {
  readonly eyebrow: string;
  readonly title: string;
  readonly detail: string;
  readonly metric: string;
  readonly icon: typeof ShieldCheck;
};

const SLIDES: readonly Slide[] = [
  {
    eyebrow: 'LOCAL-FIRST FIELD INTELLIGENCE',
    title: 'Turn field observations into a reliable installed base.',
    detail: 'FieldSight transforms natural field notes into structured evidence so teams can understand what equipment exists, where it is, and how reliable each observation is.',
    metric: 'Field note → Observation → Installed base',
    icon: DatabaseZap,
  },
  {
    eyebrow: 'VOICE, WITHOUT THE CLOUD',
    title: 'Dictate in the field. QVAC transcribes and organizes locally.',
    detail: 'Parakeet processes speech on-device and the local LLM cleans the text without filling in missing facts. The result always remains reviewable and editable before persistence.',
    metric: 'Audio → transcript → cleaned note',
    icon: Mic2,
  },
  {
    eyebrow: 'PRIVATE BY ARCHITECTURE',
    title: 'Sensitive inference stays on the device.',
    detail: 'The product does not depend on a cloud inference endpoint. Structured extraction, validation, and reconciliation form an auditable path designed for sensitive customer contexts.',
    metric: 'QVAC · on-device · auditable',
    icon: ShieldCheck,
  },
];

export function OnboardingScreen({ onFinish }: { readonly onFinish: () => void }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const slide = SLIDES[index] ?? SLIDES[0]!;
  const Icon = slide.icon;

  function move(next: number) {
    Animated.sequence([
      Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    setIndex(next);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, minHeight: '100%' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 1180, alignSelf: 'center', paddingHorizontal: compact ? spacing.lg : spacing.xxl, paddingVertical: compact ? spacing.xl : 56 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ width: 30, height: 30, borderRadius: 9, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
              <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: colors.primary }} />
            </View>
            <Text style={{ color: colors.text, fontWeight: typography.weights.bold, fontSize: typography.sizes.md }}>FieldSight</Text>
          </View>
          <Pressable onPress={onFinish} accessibilityRole="button"><Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm }}>Skip</Text></Pressable>
        </View>

        <Animated.View style={{ flex: 1, opacity: fade, justifyContent: 'center', paddingVertical: 56 }}>
          <View style={{ flexDirection: compact ? 'column' : 'row', gap: compact ? spacing.xxl : 64, alignItems: compact ? 'stretch' : 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.primary, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, letterSpacing: 1.35 }}>{slide.eyebrow}</Text>
              <Text style={{ color: colors.text, fontSize: compact ? 38 : 58, lineHeight: compact ? 44 : 64, fontWeight: typography.weights.bold, letterSpacing: -1.5, marginTop: spacing.lg }}>{slide.title}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: compact ? typography.sizes.md : 18, lineHeight: compact ? 24 : 28, maxWidth: 690, marginTop: spacing.xl }}>{slide.detail}</Text>
              <View style={{ marginTop: spacing.xl, alignSelf: 'flex-start', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
                <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold }}>{slide.metric}</Text>
              </View>
            </View>

            <View style={{ width: compact ? '100%' : 340, height: compact ? 250 : 340, borderRadius: 32, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
              {Array.from({ length: 6 }, (_, row) => Array.from({ length: 6 }, (_, col) => (
                <View key={`${row}-${col}`} style={{ position: 'absolute', width: 3, height: 3, borderRadius: 2, backgroundColor: colors.borderStrong, left: 34 + col * 54, top: 34 + row * 54, opacity: 0.7 }} />
              )))}
              <View style={{ width: 120, height: 120, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary }}>
                <Icon size={46} color={colors.primary} strokeWidth={1.7} />
              </View>
              <View style={{ position: 'absolute', width: 210, height: 210, borderRadius: 105, borderWidth: 1, borderColor: colors.border }} />
              <View style={{ position: 'absolute', width: 286, height: 286, borderRadius: 143, borderWidth: 1, borderColor: colors.border, opacity: 0.65 }} />
            </View>
          </View>
        </Animated.View>

        <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.lg, flexDirection: compact ? 'column' : 'row', gap: spacing.lg, alignItems: compact ? 'stretch' : 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {SLIDES.map((_, dot) => <View key={dot} style={{ height: 5, width: dot === index ? 34 : 12, borderRadius: 3, backgroundColor: dot === index ? colors.primary : colors.borderStrong }} />)}
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' }}>
            {index > 0 ? <Button variant="secondary" onPress={() => move(index - 1)}>Back</Button> : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => index === SLIDES.length - 1 ? onFinish() : move(index + 1)}
              style={({ pressed }) => ({ minHeight: 46, borderRadius: radius.md, paddingHorizontal: spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.text, opacity: pressed ? 0.82 : 1 })}
            >
              <Text style={{ color: colors.background, fontWeight: typography.weights.semibold }}>{index === SLIDES.length - 1 ? 'Enter FieldSight' : 'Next'}</Text>
              <ArrowRight size={17} color={colors.background} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
