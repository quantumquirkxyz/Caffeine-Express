import { TextInput, type TextInputProps, type ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../tokens';

export function SearchField({ style, placeholder = 'Search', ...props }: TextInputProps & { readonly style?: ViewStyle }) {
  return <TextInput {...props} placeholder={placeholder} placeholderTextColor={colors.textMuted} style={[{ minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: spacing.lg, fontSize: typography.sizes.md }, style]} />;
}
