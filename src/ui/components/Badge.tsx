import type { PropsWithChildren } from 'react';
import { Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { radius, spacing, typography, useTheme } from '../tokens';

export function Badge({ children, tone = 'neutral', style }: PropsWithChildren<{ readonly tone?: 'neutral' | 'blue' | 'green' | 'red' | 'purple'; readonly style?: ViewStyle }>) {
  const { colors } = useTheme();
  const palette = { neutral: [colors.surfaceMuted, colors.textSecondary], blue: [colors.primarySoft, colors.primary], green: [colors.successSoft, colors.success], red: [colors.dangerSoft, colors.danger], purple: [colors.purpleSoft, colors.purple] }[tone];
  return <View style={[{ alignSelf: 'flex-start', backgroundColor: palette[0], borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }, style]}><Text style={{ color: palette[1], fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold } as TextStyle}>{children}</Text></View>;
}
