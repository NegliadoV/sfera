'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { Locale, LocaleMeta, TranslationSchema } from '@/lib/i18n/types';
import { SUPPORTED_LOCALES } from '@/lib/i18n/types';
import { getDictionary } from '@/lib/i18n/dictionaries';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  dict: TranslationSchema;
  t: (path: string, fallback?: string) => string;
  locales: LocaleMeta[];
  currentLocaleMeta: LocaleMeta;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'roominate_locale';

export function LanguageProvider({
  children,
  defaultLocale = 'ru',
}: {
  children: React.ReactNode;
  defaultLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    // 1. Попытка загрузить из localStorage
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && SUPPORTED_LOCALES.some((l) => l.code === saved)) {
      setLocaleState(saved);
      document.documentElement.lang = saved;
      return;
    }

    // 2. Авто-определение языка браузера
    try {
      const browserLang = navigator.language.slice(0, 2).toLowerCase() as Locale;
      const matched = SUPPORTED_LOCALES.find((l) => l.code === browserLang);
      if (matched) {
        setLocaleState(matched.code);
        document.documentElement.lang = matched.code;
      }
    } catch {
      // Игнорируем ошибки при отсутствии navigator
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    if (!SUPPORTED_LOCALES.some((l) => l.code === newLocale)) return;
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = newLocale;
    } catch (e) {
      console.warn('Failed to save locale:', e);
    }
  };

  const dict = useMemo(() => getDictionary(locale), [locale]);

  const currentLocaleMeta = useMemo(
    () => SUPPORTED_LOCALES.find((l) => l.code === locale) || SUPPORTED_LOCALES[0],
    [locale]
  );

  /**
   * Получение перевода по ключу вида 'common.save' или 'nav.explore'
   */
  const t = (path: string, fallback = ''): string => {
    const keys = path.split('.');
    let current: any = dict;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return fallback || path;
      }
    }
    return typeof current === 'string' ? current : fallback || path;
  };

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      dict,
      t,
      locales: SUPPORTED_LOCALES,
      currentLocaleMeta,
    }),
    [locale, dict, currentLocaleMeta]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback если компонент отрендерен вне провайдера
    const defaultDict = getDictionary('ru');
    return {
      locale: 'ru' as Locale,
      setLocale: () => {},
      dict: defaultDict,
      t: (path: string, fallback = '') => {
        const keys = path.split('.');
        let current: any = defaultDict;
        for (const k of keys) {
          if (current && typeof current === 'object' && k in current) current = current[k];
          else return fallback || path;
        }
        return typeof current === 'string' ? current : fallback || path;
      },
      locales: SUPPORTED_LOCALES,
      currentLocaleMeta: SUPPORTED_LOCALES[0],
    };
  }
  return context;
}

// Alias for accessing locale directly
export const useLanguage = useTranslation;
