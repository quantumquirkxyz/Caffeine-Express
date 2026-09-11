import { Building2, MapPinned } from 'lucide-react-native';
import { Text, View, useWindowDimensions } from 'react-native';
import type { OverviewAggregation } from '../dashboard/dashboard';
import { Card } from '../ui/components/Card';
import { SectionHeader } from '../ui/components/SectionHeader';
import { spacing, typography, useTheme } from '../ui/tokens';

const DOT_COUNT = 36;

function DonutDots({ aggregation }: { readonly aggregation: OverviewAggregation }) {
  const { colors } = useTheme();
  const total = Math.max(aggregation.units, 1);
  const palette = [colors.primary, colors.success, colors.purple, colors.danger];
  const boundaries = aggregation.byModality.reduce<number[]>((acc, entry, index) => {
    const previous = index === 0 ? 0 : acc[index - 1];
    acc.push(previous + entry.value / total);
    return acc;
  }, []);

  return (
    <View style={{ width: 190, height: 190, alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: DOT_COUNT }, (_, index) => {
        const progress = index / DOT_COUNT;
        const category = Math.max(0, boundaries.findIndex(boundary => progress < boundary));
        const angle = (Math.PI * 2 * index) / DOT_COUNT - Math.PI / 2;
        const radius = 76;
        return (
          <View
            key={index}
            style={{
              position: 'absolute',
              width: 10,
              height: 10,
              borderRadius: 5,
              left: 95 + Math.cos(angle) * radius - 5,
              top: 95 + Math.sin(angle) * radius - 5,
              backgroundColor: palette[category % palette.length],
            }}
          />
        );
      })}
      <View style={{ width: 108, height: 108, borderRadius: 54, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
        <Text style={{ color: colors.text, fontSize: 30, lineHeight: 34, fontWeight: typography.weights.bold }}>{aggregation.units}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs }}>total units</Text>
      </View>
    </View>
  );
}

export function DistributionRail({ aggregation }: { readonly aggregation: OverviewAggregation }) {
  const { colors } = useTheme();
  const compact = useWindowDimensions().width < 560;
  const total = Math.max(aggregation.units, 1);
  const palette = [colors.primary, colors.success, colors.purple, colors.danger];

  return (
    <Card>
      <SectionHeader title="Equipment mix" subtitle="Share of the installed base" />
      <View style={{ flexDirection: compact ? 'column' : 'row', alignItems: 'center', gap: spacing.xl }}>
        <DonutDots aggregation={aggregation} />
        <View style={{ flex: 1, width: compact ? '100%' : undefined, gap: spacing.sm }}>
          {aggregation.byModality.map((entry, index) => (
            <View key={entry.label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: index === aggregation.byModality.length - 1 ? 0 : 1, borderBottomColor: colors.border }}>
              <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: palette[index % palette.length] }} />
              <Text numberOfLines={1} style={{ flex: 1, color: colors.text, fontSize: typography.sizes.sm }}>{entry.label}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs }}>{Math.round((entry.value / total) * 100)}%</Text>
              <Text style={{ color: colors.text, fontWeight: typography.weights.bold }}>{entry.value}</Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

export function ClientRanking({ aggregation }: { readonly aggregation: OverviewAggregation }) {
  const { colors } = useTheme();
  const maximum = Math.max(...aggregation.byClient.map(entry => entry.value), 1);
  return (
    <Card>
      <SectionHeader title="Client concentration" subtitle="Relative size without noisy axes" />
      <View style={{ gap: spacing.md }}>
        {aggregation.byClient.slice(0, 6).map((entry, index) => {
          const diameter = 20 + Math.round((entry.value / maximum) * 22);
          return (
            <View key={entry.label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: diameter, height: diameter, borderRadius: diameter / 2, backgroundColor: index === 0 ? colors.primary : colors.primarySoft, borderWidth: 1, borderColor: colors.primary }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold }}>{entry.label}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, marginTop: 2 }}>{entry.value} units</Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs }}>#{index + 1}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

export function SiteDots({ aggregation }: { readonly aggregation: OverviewAggregation }) {
  const { colors } = useTheme();
  const maximum = Math.max(...aggregation.sitesByClient.map(entry => entry.value), 1);
  return (
    <Card>
      <SectionHeader title="Site footprint" subtitle="Geographic coverage per Client" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        {aggregation.sitesByClient.map((entry, index) => {
          const size = 78 + Math.round((entry.value / maximum) * 36);
          return (
            <View key={entry.label} style={{ width: size, minHeight: size, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: index === 0 ? colors.primarySoft : colors.surfaceMuted, padding: spacing.md, justifyContent: 'space-between' }}>
              <MapPinned size={17} color={index === 0 ? colors.primary : colors.textSecondary} />
              <View>
                <Text numberOfLines={2} style={{ color: colors.text, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold }}>{entry.label}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, marginTop: 2 }}>{entry.value} sites</Text>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}
