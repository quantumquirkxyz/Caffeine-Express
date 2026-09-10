import { Activity, Building2, MapPinned, PackageOpen } from 'lucide-react-native';
import { Text, View, useWindowDimensions } from 'react-native';
import type { OverviewAggregation } from '../dashboard/dashboard';
import { Card } from '../ui/components/Card';
import { MetricCard } from '../ui/components/MetricCard';
import { SectionHeader } from '../ui/components/SectionHeader';
import { spacing, typography, useTheme } from '../ui/tokens';
import { ClientRanking, DistributionRail, SiteDots } from './OverviewVisuals';

type Copy = { readonly clients: string; readonly sites: string; readonly units: string; readonly overview?: { readonly kicker: string; readonly title: string; readonly modality: string; readonly client: string; readonly sites: string; readonly modalitySubtitle: string; readonly clientSubtitle: string; readonly sitesSubtitle: string; readonly empty: string } };

function BarChart({ title, subtitle, entries, icon: Icon }: { readonly title: string; readonly subtitle: string; readonly entries: readonly { readonly label: string; readonly value: number }[]; readonly icon: typeof Activity }) {
  const { colors } = useTheme();
  const maximum = Math.max(...entries.map((entry) => entry.value), 1);
  return <Card><SectionHeader title={title} subtitle={subtitle} /><View style={{ gap: spacing.md }}>{entries.length === 0 ? <Text style={{ color: colors.textSecondary }}>No data available</Text> : entries.map((entry) => <View key={entry.label}><View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}><Icon size={15} color={colors.primary} /><Text numberOfLines={1} style={{ flex: 1, color: colors.text, fontSize: typography.sizes.sm }}>{entry.label}</Text><Text style={{ color: colors.text, fontWeight: typography.weights.semibold }}>{entry.value}</Text></View><View accessible accessibilityLabel={`${entry.label}: ${entry.value}`} style={{ height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: colors.surfaceMuted }}><View style={{ width: `${(entry.value / maximum) * 100}%`, height: '100%', borderRadius: 5, backgroundColor: colors.primary }} /></View></View>)}</View></Card>;
}

export function OverviewScreen({ copy, aggregation }: { readonly copy: Copy; readonly aggregation: OverviewAggregation }) {
  const { colors } = useTheme();
  const compact = useWindowDimensions().width < 840;
  const strings = copy.overview;
  return <View><View style={{ marginBottom: spacing.xl }}><Text style={{ color: colors.primary, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, letterSpacing: 1.2 }}>{strings?.kicker ?? 'OVERVIEW'}</Text><Text style={{ color: colors.text, fontSize: 32, lineHeight: 38, fontWeight: typography.weights.bold, marginTop: spacing.sm }}>{strings?.title ?? 'Installed base'}</Text></View><View style={{ flexDirection: compact ? 'column' : 'row', gap: spacing.md, marginBottom: spacing.lg }}>{[[copy.clients, aggregation.clients, colors.primary, Building2], [copy.sites, aggregation.sites, colors.primary, MapPinned], [copy.units, aggregation.units, colors.success, PackageOpen]].map(([label, value, accent, icon]) => <MetricCard key={String(label)} label={String(label)} value={value as number} accent={String(accent)} icon={icon as typeof Building2} style={{ flex: 1 }} />)}</View><View style={{ flexDirection: compact ? 'column' : 'row', gap: spacing.lg, marginBottom: spacing.lg }}><View style={{ flex: 1 }}><DistributionRail aggregation={aggregation} /></View><View style={{ flex: 1 }}><ClientRanking aggregation={aggregation} /></View></View><SiteDots aggregation={aggregation} /></View>;
}
