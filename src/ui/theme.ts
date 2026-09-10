import type { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  background: '#F7F9FC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primarySoft: '#EAF2FF',
  text: '#172B4D',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  success: '#15803D',
  successSoft: '#ECFDF3',
  danger: '#B42318',
  dangerSoft: '#FFF1F0',
  purple: '#6941C6',
  purpleSoft: '#F4F0FF',
  white: '#FFFFFF',
} as const;

export const typography = {
  family: 'System',
  sizes: { xs: 12, sm: 13, md: 14, lg: 16, xl: 20, display: 28 },
  weights: { regular: '400', medium: '500', semibold: '600', bold: '700' } as const,
  lineHeights: { tight: 18, normal: 21, relaxed: 24, heading: 34 },
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 40 } as const;
export const radius = { sm: 8, md: 10, lg: 12, xl: 14, pill: 999 } as const;
export const borders = { width: 1, subtle: { borderWidth: 1, borderColor: colors.border } as ViewStyle } as const;
export const shadows = {
  soft: { shadowColor: colors.text, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 3 }, elevation: 2 } as ViewStyle,
  none: {} as ViewStyle,
} as const;

export const textStyles = {
  body: { color: colors.text, fontSize: typography.sizes.md, lineHeight: typography.lineHeights.normal } as TextStyle,
  secondary: { color: colors.textSecondary, fontSize: typography.sizes.sm, lineHeight: typography.lineHeights.normal } as TextStyle,
} as const;

export const theme = { colors, typography, spacing, radius, borders, shadows, textStyles } as const;
