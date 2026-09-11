import { BarChart3, Database, FilePenLine } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { radius, spacing, typography, useTheme } from '../ui/tokens';
import { FieldSightLockup } from '../ui/brand/FieldSightLogo';
import type { AppCopy } from '../i18n/copy';

export type AppSection = 'overview' | 'capture' | 'inventory';

const items = [
  ['overview', BarChart3, 'Overview'],
  ['capture', FilePenLine, 'Capture'],
  ['inventory', Database, 'Installed base'],
] as const;

export function DesktopSidebar({ activeSection, onNavigate, copy }: { readonly activeSection: AppSection; readonly onNavigate: (section: AppSection) => void; readonly copy: AppCopy }) {
  const { colors } = useTheme();
  const labels = [copy.nav.overview, copy.nav.capture, copy.nav.inventory];
  return <View style={{ width: 216, backgroundColor: colors.surface, borderRightWidth: 1, borderRightColor: colors.border, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.lg, justifyContent: 'space-between' }}><View><View style={{ marginBottom: spacing.xxxl }}><FieldSightLockup markSize={40} /></View>{items.map(([section, Icon], index) => <TouchableOpacity key={section} accessibilityRole="button" accessibilityLabel={labels[index]} onPress={() => onNavigate(section)} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, marginBottom: spacing.xs, borderRadius: radius.sm, backgroundColor: activeSection === section ? colors.primarySoft : 'transparent', borderLeftWidth: activeSection === section ? 3 : 0, borderLeftColor: colors.primary }}><Icon size={18} color={activeSection === section ? colors.primary : colors.textSecondary} /><Text style={{ color: activeSection === section ? colors.primary : colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: activeSection === section ? typography.weights.semibold : typography.weights.medium }}>{labels[index]}</Text></TouchableOpacity>)}</View><Text style={{ color: colors.textMuted, fontSize: typography.sizes.xs }}>LOCAL-FIRST · MVP</Text></View>;
}
