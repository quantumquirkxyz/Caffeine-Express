import type { PropsWithChildren } from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import { Card } from './Card';
import { colors, spacing, typography } from '../tokens';

export function MetricCard({ label, value, detail, accent = colors.primary, style }: PropsWithChildren<{ readonly label: string; readonly value: string | number; readonly detail?: string; readonly accent?: string; readonly style?: ViewStyle }>) {
  return <Card style={style}><View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${accent}18`, marginBottom: spacing.lg }} /><Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm }}>{label}</Text><Text style={{ color: colors.text, fontSize: typography.sizes.display, lineHeight: typography.lineHeights.heading, fontWeight: typography.weights.bold, marginTop: spacing.xs }}>{value}</Text>{detail ? <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, marginTop: spacing.sm }}>{detail}</Text> : null}</Card>;
}
