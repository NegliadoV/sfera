import type { Locale, TranslationSchema } from '../types';
import { ru } from './ru';
import { en } from './en';
import { zh } from './zh';
import { ja } from './ja';
import { ko } from './ko';
import { vi } from './vi';
import { es } from './es';
import { de } from './de';
import { fr } from './fr';

export const dictionaries: Record<Locale, TranslationSchema> = {
  ru,
  en,
  zh,
  ja,
  ko,
  vi,
  es,
  de,
  fr,
};

export function getDictionary(locale: Locale = 'ru'): TranslationSchema {
  return dictionaries[locale] || dictionaries.ru;
}
