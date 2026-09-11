import { Activity, Moon, Sun } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { spacing, typography, useTheme } from '../ui/tokens';
import { FieldSightLockup } from '../ui/brand/FieldSightLogo';

export function MobileHeader({ language, onLanguage }: { readonly language: 'en' | 'es' | 'pt'; readonly onLanguage: (language: 'en' | 'es' | 'pt') => void }) {
  const { colors, resolvedMode, setMode } = useTheme();
  return <View style={{ minHeight: 58, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}><FieldSightLockup markSize={32} /><View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}><Activity size={14} color={colors.success} /><Text style={{ color: colors.success, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold }}>LOCAL</Text></View><Pressable onPress={() => onLanguage(language === 'en' ? 'es' : language === 'es' ? 'pt' : 'en')}><Text style={{ color: colors.primary, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold }}>{language.toUpperCase()}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Toggle theme" onPress={() => setMode(resolvedMode === 'dark' ? 'light' : 'dark')}>{resolvedMode === 'dark' ? <Sun size={17} color={colors.primary} /> : <Moon size={17} color={colors.primary} />}</Pressable></View></View>;
}
