import { useMemo } from 'react';
import { useContext } from 'react';
import { AppThemeContext } from '@/contexts/AppThemeContext';
import { darkColors, lightColors } from '@/constants/Theme';

const DEFAULT_ACCENT = { value: '#2563eb', hover: '#1d4ed8' };

export type ThemeColors = typeof darkColors;

/** Цвета темы с учётом выбранной темы и акцента из настроек. Всегда возвращает объект без undefined. */
export function useThemeColors(): ThemeColors {
  const ctx = useContext(AppThemeContext);
  const themeMode = ctx?.themeMode === 'light' ? 'light' : 'dark';
  const accent = ctx?.accent ?? DEFAULT_ACCENT;
  const accentValue = typeof accent?.value === 'string' ? accent.value : DEFAULT_ACCENT.value;
  const accentHoverVal = typeof accent?.hover === 'string' ? accent.hover : DEFAULT_ACCENT.hover;
  const base = themeMode === 'dark' ? darkColors : lightColors;
  return useMemo(() => {
    const merged: ThemeColors = {
      ...darkColors,
      ...base,
      accent: accentValue,
      accentHover: accentHoverVal,
      accentMuted: accentValue + '99',
    };
    return merged;
  }, [themeMode, accentValue, accentHoverVal]);
}
