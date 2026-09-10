import type { PropsWithChildren } from 'react';
import { View, type ViewProps } from 'react-native';
import { radius, spacing, useTheme } from '../tokens';

export function Card({ children, style, padded = true, ...props }: PropsWithChildren<ViewProps> & { readonly padded?: boolean }) {
  const { colors, borders, shadows } = useTheme();
  return <View {...props} style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, ...borders.subtle, ...shadows.soft, ...(padded ? { padding: spacing.xl } : {}) }, style]}>{children}</View>;
}
