import { Text, View, type ViewStyle } from 'react-native';
import { spacing, typography, useTheme } from '../tokens';

export function SectionHeader({ title, subtitle, action, style }: { readonly title: string; readonly subtitle?: string; readonly action?: React.ReactNode; readonly style?: ViewStyle }) {
  const { colors } = useTheme();
  return <View style={[{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.lg }, style]}><View style={{ flex: 1 }}><Text style={{ color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.semibold }}>{title}</Text>{subtitle ? <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm, marginTop: spacing.xs }}>{subtitle}</Text> : null}</View>{action}</View>;
}
