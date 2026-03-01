/**
 * Хранение настроек внешнего вида (тема, акцент).
 * Web: localStorage (как в веб-приложении). Native: SecureStore.
 */
import * as SecureStore from 'expo-secure-store';

const THEME_KEY = 'noosphere-theme';
const ACCENT_KEY = 'noosphere-accent';

const isWeb = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export type ThemeMode = 'dark' | 'light';

export type StoredAccent = { value: string; hover: string };

const defaultAccent: StoredAccent = { value: '#2563eb', hover: '#1d4ed8' };

export async function getStoredTheme(): Promise<ThemeMode> {
  if (isWeb) {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' ? 'light' : 'dark';
  }
  try {
    const v = await SecureStore.getItemAsync(THEME_KEY);
    return v === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export async function setStoredTheme(mode: ThemeMode): Promise<void> {
  if (isWeb) {
    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch {}
    return;
  }
  try {
    await SecureStore.setItemAsync(THEME_KEY, mode);
  } catch {}
}

export async function getStoredAccent(): Promise<StoredAccent> {
  if (isWeb) {
    try {
      const raw = localStorage.getItem(ACCENT_KEY);
      if (!raw) return defaultAccent;
      const parsed = JSON.parse(raw) as StoredAccent;
      if (parsed?.value && parsed?.hover) return parsed;
    } catch {}
    return defaultAccent;
  }
  try {
    const raw = await SecureStore.getItemAsync(ACCENT_KEY);
    if (!raw) return defaultAccent;
    const parsed = JSON.parse(raw) as StoredAccent;
    if (parsed?.value && parsed?.hover) return parsed;
  } catch {}
  return defaultAccent;
}

export async function setStoredAccent(accent: StoredAccent): Promise<void> {
  if (isWeb) {
    try {
      localStorage.setItem(ACCENT_KEY, JSON.stringify(accent));
    } catch {}
    return;
  }
  try {
    await SecureStore.setItemAsync(ACCENT_KEY, JSON.stringify(accent));
  } catch {}
}

/** Пресеты акцента (как в веб-приложении lib/theme.ts) */
export const ACCENT_PRESETS: { name: string; value: string; hover: string }[] = [
  { name: 'Синий', value: '#2563eb', hover: '#1d4ed8' },
  { name: 'Фиолетовый', value: '#8b5cf6', hover: '#7c3aed' },
  { name: 'Зелёный', value: '#22c55e', hover: '#16a34a' },
  { name: 'Бирюзовый', value: '#0d9488', hover: '#0f766e' },
  { name: 'Оранжевый', value: '#f97316', hover: '#ea580c' },
  { name: 'Розовый', value: '#ec4899', hover: '#db2777' },
  { name: 'Красный', value: '#ef4444', hover: '#dc2626' },
];
