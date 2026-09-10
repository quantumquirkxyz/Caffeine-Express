import type { PropsWithChildren } from 'react';
import { Pressable, Text, type PressableProps, type TextStyle, type ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../tokens';

export function Button({ children, variant = 'primary', style, ...props }: PropsWithChildren<PressableProps> & { readonly variant?: 'primary' | 'secondary' | 'ghost'; readonly style?: ViewStyle }) {
  const styles = { primary: { backgroundColor: colors.primary, borderColor: colors.primary, text: colors.white }, secondary: { backgroundColor: colors.surface, borderColor: colors.borderStrong, text: colors.text }, ghost: { backgroundColor: 'transparent', borderColor: 'transparent', text: colors.primary } }[variant];
  return <Pressable {...props} style={({ pressed }) => [{ minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.xl, backgroundColor: styles.backgroundColor, borderColor: styles.borderColor, opacity: pressed ? 0.82 : 1 }, style]}><Text style={{ color: styles.text, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold } as TextStyle}>{children}</Text></Pressable>;
}
