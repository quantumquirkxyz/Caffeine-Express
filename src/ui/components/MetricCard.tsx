import type { PropsWithChildren } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { Text, View, type ViewStyle } from 'react-native';
import { Card } from './Card';
import { spacing, typography, useTheme } from '../tokens';

export function MetricCard({ label, value, detail, accent, icon: Icon, style }: PropsWithChildren<{ readonly label: string; readonly value: string | number; readonly detail?: string; readonly accent?: string; readonly icon?: LucideIcon; readonly style?: ViewStyle }>) {
  const { colors } = useTheme();
  const color = accent ?? colors.primary;
  return <Card style={style}><View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${color}18`, marginBottom: spacing.lg, alignItems: 'center', justifyContent: 'center' }}>{Icon ? <Icon size={18} color={color} /> : null}</View><Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm }}>{label}</Text><Text style={{ color: colors.text, fontSize: typography.sizes.display, lineHeight: typography.lineHeights.heading, fontWeight: typography.weights.bold, marginTop: spacing.xs }}>{value}</Text>{detail ? <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, marginTop: spacing.sm }}>{detail}</Text> : null}</Card>;
}
