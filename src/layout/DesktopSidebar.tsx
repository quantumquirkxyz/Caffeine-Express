import { BarChart3, Database, FilePenLine, Settings } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { radius, spacing, typography, useTheme } from '../ui/tokens';

export type AppSection = 'overview' | 'capture' | 'inventory';

const items = [
  ['overview', BarChart3, 'Resumen'],
  ['capture', FilePenLine, 'Captura'],
  ['inventory', Database, 'Base instalada'],
] as const;

export function DesktopSidebar({ activeSection, onNavigate }: { readonly activeSection: AppSection; readonly onNavigate: (section: AppSection) => void }) {
  const { colors } = useTheme();
  return <View style={{ width: 216, backgroundColor: colors.surface, borderRightWidth: 1, borderRightColor: colors.border, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.lg, justifyContent: 'space-between' }}><View><View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xxxl }}><View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.white, fontSize: 20, fontWeight: typography.weights.bold }}>F</Text></View><Text style={{ color: colors.text, fontSize: typography.sizes.md, fontWeight: typography.weights.bold }}>FieldSight</Text></View>{items.map(([section, Icon, label]) => <TouchableOpacity key={section} accessibilityRole="button" accessibilityLabel={label} onPress={() => onNavigate(section)} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, marginBottom: spacing.xs, borderRadius: radius.sm, backgroundColor: activeSection === section ? colors.primarySoft : 'transparent', borderLeftWidth: activeSection === section ? 3 : 0, borderLeftColor: colors.primary }}><Icon size={18} color={activeSection === section ? colors.primary : colors.textSecondary} /><Text style={{ color: activeSection === section ? colors.primary : colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: activeSection === section ? typography.weights.semibold : typography.weights.medium }}>{label}</Text></TouchableOpacity>)}<TouchableOpacity accessibilityRole="button" accessibilityLabel="Configuración" style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md }}><Settings size={18} color={colors.textSecondary} /><Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm }}>Configuración</Text></TouchableOpacity></View><Text style={{ color: colors.textMuted, fontSize: typography.sizes.xs }}>LOCAL-FIRST · MVP</Text></View>;
}
