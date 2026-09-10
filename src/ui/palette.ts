import type { ViewStyle } from 'react-native';

export const lightColors = { background: '#F7F9FC', surface: '#FFFFFF', surfaceMuted: '#F1F5F9', primary: '#2563EB', primaryDark: '#1D4ED8', primarySoft: '#EAF2FF', text: '#172B4D', textSecondary: '#64748B', textMuted: '#94A3B8', border: '#E2E8F0', borderStrong: '#CBD5E1', success: '#15803D', successSoft: '#ECFDF3', danger: '#B42318', dangerSoft: '#FFF1F0', purple: '#6941C6', purpleSoft: '#F4F0FF', white: '#FFFFFF' } as const;
export const darkColors = { background: '#0E1726', surface: '#182338', surfaceMuted: '#22314D', primary: '#7CB4FF', primaryDark: '#4C8DFF', primarySoft: '#1B2C4E', text: '#EAF0F8', textSecondary: '#A9B8CC', textMuted: '#7C8BA1', border: '#2A3A55', borderStrong: '#3D4F70', success: '#5ECB87', successSoft: '#132A22', danger: '#FF8A80', dangerSoft: '#3D242A', purple: '#C9B8FF', purpleSoft: '#332A4E', white: '#FFFFFF' } as const;
export type ThemeColors = { readonly [key in keyof typeof lightColors]: string };
export type ThemeMode = 'system' | 'light' | 'dark';
export const themedBorders = (colors: ThemeColors) => ({ subtle: { borderWidth: 1, borderColor: colors.border } as ViewStyle });
export const themedShadows = (colors: ThemeColors) => ({ soft: { boxShadow: `0px 3px 12px ${colors.text}14` } as ViewStyle, none: {} as ViewStyle });
