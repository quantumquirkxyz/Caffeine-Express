import { Text, View } from 'react-native';
import { SearchField } from '../ui/components/SearchField';
import { Badge } from '../ui/components/Badge';
import { colors, spacing, typography } from '../ui/tokens';

export function DesktopTopbar({ language, onLanguage }: { readonly language: 'en' | 'es'; readonly onLanguage: (language: 'en' | 'es') => void }) {
  return <View style={{ height: 74, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.xxl, flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}><SearchField placeholder="Buscar en la base instalada" style={{ width: 280, backgroundColor: colors.surfaceMuted }} /><View style={{ flex: 1 }} /><Badge tone="blue">Inferencia local</Badge><Badge tone="green">Datos en el dispositivo</Badge><Badge tone="purple">QVAC on-device</Badge><Text onPress={() => onLanguage(language === 'en' ? 'es' : 'en')} style={{ color: colors.primary, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold }}>{language.toUpperCase()}</Text><View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.primary, fontWeight: typography.weights.bold }}>Q</Text></View><View><Text style={{ color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold }}>Collaborator</Text><Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs }}>Field team</Text></View></View>;
}
