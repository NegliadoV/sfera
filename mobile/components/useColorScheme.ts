import { useContext } from 'react';
import { AppThemeContext } from '@/contexts/AppThemeContext';

/** Тема приложения: из настроек (AppThemeContext) или по умолчанию тёмная. Никогда не возвращает undefined. */
export function useColorScheme(): 'dark' | 'light' {
  try {
    const ctx = useContext(AppThemeContext);
    if (ctx?.themeMode === 'light') return 'light';
  } catch {
    // outside provider
  }
  return 'dark';
}
