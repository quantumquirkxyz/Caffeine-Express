import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode } from './ui/palette';

const KEY = 'fieldsight.preferences.v1';
export type Language = 'en' | 'es' | 'pt';
export type Preferences = { readonly language: Language; readonly themeMode: ThemeMode };
const defaults: Preferences = { language: 'en', themeMode: 'system' };
export async function loadPreferences(): Promise<Preferences> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      language: 'en',
      themeMode: parsed.themeMode === 'light' || parsed.themeMode === 'dark' ? parsed.themeMode : 'system',
    };
  } catch {
    return defaults;
  }
}
export async function savePreferences(preferences: Preferences) { await AsyncStorage.setItem(KEY, JSON.stringify(preferences)); }
