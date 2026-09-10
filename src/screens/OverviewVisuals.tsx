import { Activity, Building2, MapPinned } from 'lucide-react-native';
import { Text, View } from 'react-native';
import type { OverviewAggregation } from '../dashboard/dashboard';
import { Card } from '../ui/components/Card';
import { SectionHeader } from '../ui/components/SectionHeader';
import { spacing, typography, useTheme } from '../ui/tokens';

export function DistributionRail({ aggregation }: { readonly aggregation: OverviewAggregation }) {
  const { colors } = useTheme();
  const total = Math.max(aggregation.units, 1);
  return <Card><SectionHeader title="Equipment mix" subtitle="Share of the installed base" /><View style={{ height: 18, flexDirection: 'row', overflow: 'hidden', borderRadius: 9, backgroundColor: colors.surfaceMuted }}>{aggregation.byModality.map((entry, index) => <View key={entry.label} style={{ flex: entry.value, backgroundColor: [colors.primary, colors.success, colors.purple, colors.danger][index % 4] }} />)}</View><View style={{ marginTop: spacing.lg, gap: spacing.sm }}>{aggregation.byModality.map(entry => <View key={entry.label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}><Activity size={15} color={colors.primary} /><Text style={{ flex: 1, color: colors.text, fontSize: typography.sizes.sm }}>{entry.label}</Text><Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs }}>{Math.round(entry.value / total * 100)}%</Text><Text style={{ color: colors.text, fontWeight: typography.weights.bold }}>{entry.value}</Text></View>)}</View></Card>;
}

export function ClientRanking({ aggregation }: { readonly aggregation: OverviewAggregation }) {
  const { colors } = useTheme();
  const total = Math.max(aggregation.units, 1);
  return <Card><SectionHeader title="Client ranking" subtitle="Largest installed bases first" />{aggregation.byClient.map((entry, index) => <View key={entry.label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: index === aggregation.byClient.length - 1 ? 0 : 1, borderBottomColor: colors.border }}><View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: index === 0 ? colors.primarySoft : colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: index === 0 ? colors.primary : colors.textSecondary, fontWeight: typography.weights.bold }}>{index + 1}</Text></View><Text numberOfLines={1} style={{ flex: 1, color: colors.text, fontSize: typography.sizes.sm }}>{entry.label}</Text><Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs }}>{Math.round(entry.value / total * 100)}%</Text><Text style={{ color: colors.text, fontWeight: typography.weights.bold }}>{entry.value}</Text></View>)}</Card>;
}

export function SiteDots({ aggregation }: { readonly aggregation: OverviewAggregation }) {
  const { colors } = useTheme();
  return <Card><SectionHeader title="Site footprint" subtitle="Sites distributed by Client" />{aggregation.sitesByClient.map(entry => <View key={entry.label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}><Text numberOfLines={1} style={{ width: 150, color: colors.text, fontSize: typography.sizes.sm }}>{entry.label}</Text><View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>{Array.from({ length: Math.min(entry.value, 12) }, (_, index) => <View key={index} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />)}</View><Text style={{ color: colors.text, fontWeight: typography.weights.bold }}>{entry.value}</Text></View>)}</Card>;
}
