'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getStoredTheme,
  getStoredAccent,
  getStoredBackgroundOpacity,
  getStoredBackgroundBlur,
  getStoredInterfaceTint,
  getStoredLightStyle,
  applyTheme,
  applyAccent,
  applyBackgroundOpacity,
  applyBackgroundBlur,
  applyInterfaceTint,
  applyLightStyle,
  ACCENT_PRESETS,
  BACKGROUND_OPACITY_PRESETS,
  BACKGROUND_BLUR_PRESETS,
  INTERFACE_TINT_PRESETS,
  LIGHT_STYLE_PRESETS,
  type ThemeMode,
  type LightStyle,
} from '@/lib/theme';

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  accent: { value: string; hover: string };
  setAccent: (value: string, hover: string) => void;
  accentPresets: typeof ACCENT_PRESETS;
  backgroundOpacity: number;
  setBackgroundOpacity: (value: number) => void;
  backgroundOpacityPresets: typeof BACKGROUND_OPACITY_PRESETS;
  backgroundBlur: number;
  setBackgroundBlur: (value: number) => void;
  backgroundBlurPresets: typeof BACKGROUND_BLUR_PRESETS;
  interfaceTint: number;
  setInterfaceTint: (hue: number) => void;
  interfaceTintPresets: typeof INTERFACE_TINT_PRESETS;
  lightStyle: LightStyle;
  setLightStyle: (style: LightStyle) => void;
  lightStylePresets: typeof LIGHT_STYLE_PRESETS;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [accent, setAccentState] = useState({ value: '#2563eb', hover: '#1d4ed8' });
  const [backgroundOpacity, setBackgroundOpacityState] = useState(0.95);
  const [backgroundBlur, setBackgroundBlurState] = useState(24);
  const [interfaceTint, setInterfaceTintState] = useState(0);
  const [lightStyle, setLightStyleState] = useState<LightStyle>('soft');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      setThemeState(getStoredTheme());
      setAccentState(getStoredAccent());
      setBackgroundOpacityState(getStoredBackgroundOpacity());
      setBackgroundBlurState(getStoredBackgroundBlur());
      setInterfaceTintState(getStoredInterfaceTint());
      setLightStyleState(getStoredLightStyle());
      setMounted(true);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    applyTheme(mode);
  }, []);

  const setAccent = useCallback((value: string, hover: string) => {
    setAccentState({ value, hover });
    applyAccent(value, hover);
  }, []);

  const setBackgroundOpacity = useCallback((value: number) => {
    setBackgroundOpacityState(value);
    applyBackgroundOpacity(value);
  }, []);

  const setBackgroundBlur = useCallback((value: number) => {
    setBackgroundBlurState(value);
    applyBackgroundBlur(value);
  }, []);

  const setInterfaceTint = useCallback((hue: number) => {
    setInterfaceTintState(hue);
    applyInterfaceTint(hue);
  }, []);

  const setLightStyle = useCallback((style: LightStyle) => {
    setLightStyleState(style);
    applyLightStyle(style);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
    applyAccent(accent.value, accent.hover);
    applyBackgroundOpacity(backgroundOpacity);
    applyBackgroundBlur(backgroundBlur);
    applyInterfaceTint(interfaceTint);
    applyLightStyle(lightStyle);
  }, [mounted, theme, accent.value, accent.hover, backgroundOpacity, backgroundBlur, interfaceTint, lightStyle]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      accent,
      setAccent,
      accentPresets: ACCENT_PRESETS,
      backgroundOpacity,
      setBackgroundOpacity,
      backgroundOpacityPresets: BACKGROUND_OPACITY_PRESETS,
      backgroundBlur,
      setBackgroundBlur,
      backgroundBlurPresets: BACKGROUND_BLUR_PRESETS,
      interfaceTint,
      setInterfaceTint,
      interfaceTintPresets: INTERFACE_TINT_PRESETS,
      lightStyle,
      setLightStyle,
      lightStylePresets: LIGHT_STYLE_PRESETS,
    }),
    [theme, setTheme, accent, setAccent, backgroundOpacity, setBackgroundOpacity, backgroundBlur, setBackgroundBlur, interfaceTint, setInterfaceTint, lightStyle, setLightStyle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
