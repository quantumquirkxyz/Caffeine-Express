import { Text, View } from 'react-native';
import { colors, spacing, typography } from '../ui/tokens';

export function MobileHeader({ language, onLanguage }: { readonly language: 'en' | 'es'; readonly onLanguage: (language: 'en' | 'es') => void }) {
  return <View style={{ minHeight: 58, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}><Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold }}>FieldSight</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}><Text style={{ color: colors.success, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold }}>LOCAL</Text><Text onPress={() => onLanguage(language === 'en' ? 'es' : 'en')} style={{ color: colors.primary, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold }}>{language.toUpperCase()}</Text></View></View>;
}
