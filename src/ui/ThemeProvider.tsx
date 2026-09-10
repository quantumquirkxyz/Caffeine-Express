import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, themedBorders, themedShadows, type ThemeColors, type ThemeMode } from './palette';

type ThemeContextValue = { readonly colors: ThemeColors; readonly borders: ReturnType<typeof themedBorders>; readonly shadows: ReturnType<typeof themedShadows>; readonly mode: ThemeMode; readonly resolvedMode: 'light' | 'dark'; readonly setMode: (mode: ThemeMode) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children, initialMode = 'system', onModeChange }: PropsWithChildren<{ readonly initialMode?: ThemeMode; readonly onModeChange?: (mode: ThemeMode) => void }>) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const resolvedMode = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const changeMode = (next: ThemeMode) => { setMode(next); onModeChange?.(next); };
  const value = useMemo(() => { const colors = resolvedMode === 'dark' ? darkColors : lightColors; return { colors, borders: themedBorders(colors), shadows: themedShadows(colors), mode, resolvedMode, setMode: changeMode }; }, [mode, resolvedMode, onModeChange]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (value === null) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
