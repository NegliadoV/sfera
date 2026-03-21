'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getStoredTheme,
  getStoredAccent,
  setStoredTheme,
  setStoredAccent,
  ACCENT_PRESETS,
  type ThemeMode,
  type StoredAccent,
} from '@/lib/themeStorage';

type AppThemeContextValue = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  accent: StoredAccent;
  setAccent: (value: string, hover: string) => void;
  accentPresets: typeof ACCENT_PRESETS;
  isLoaded: boolean;
};

export const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [accent, setAccentState] = useState<StoredAccent>({ value: '#2563eb', hover: '#1d4ed8' });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const savedAccent = await getStoredAccent();
      if (!cancelled) {
        setThemeModeState('dark');
        setAccentState(savedAccent);
        setIsLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Синхронизация темы с документом (web: фон, скроллбар, theme-color)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', themeMode);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && meta instanceof HTMLMetaElement) {
      meta.content = themeMode === 'dark' ? '#1a1b1d' : '#f2f3f5';
    }
  }, [themeMode]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    setStoredTheme(mode);
  }, []);

  const setAccent = useCallback((value: string, hover: string) => {
    const next = { value, hover };
    setAccentState(next);
    setStoredAccent(next);
  }, []);

  const value = useMemo<AppThemeContextValue>(
    () => ({
      themeMode,
      setThemeMode,
      accent,
      setAccent,
      accentPresets: ACCENT_PRESETS,
      isLoaded,
    }),
    [themeMode, setThemeMode, accent, setAccent, isLoaded]
  );

  return (
    <AppThemeContext.Provider value={value}>
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(AppThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within AppThemeProvider');
  return ctx;
}
