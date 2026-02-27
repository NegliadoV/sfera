/**
 * Пресеты оттенков сфер в тонах приложения (синяя палитра).
 * Используются для иконок сфер в каталоге и кабинете.
 */
export interface SphereColorPreset {
  /** Светлый блик (верх сферы) */
  highlight: string;
  /** Основной цвет */
  mid: string;
  /** Тёмный низ */
  dark: string;
  /** Цвет свечения */
  glow: string;
}

export const SPHERE_COLOR_PRESETS: SphereColorPreset[] = [
  { highlight: '#ecf5ff', mid: '#3070bb', dark: '#0f3460', glow: '#4faeff' },
  { highlight: '#e8f4ff', mid: '#3d6ba8', dark: '#0f2740', glow: '#5a9ef5' },
  { highlight: '#eef0ff', mid: '#5b6cd4', dark: '#1e2a5c', glow: '#6b7ce8' },
  { highlight: '#e8f8fc', mid: '#3d9ca8', dark: '#0f3540', glow: '#5bc4d4' },
  { highlight: '#e6f2ff', mid: '#4a7bc9', dark: '#122a50', glow: '#7ca5e8' },
  { highlight: '#eef2ff', mid: '#5b6cd4', dark: '#1a2258', glow: '#8b9cf6' },
  { highlight: '#e0f4f8', mid: '#2d7a8f', dark: '#0d2d38', glow: '#4fb3c4' },
  { highlight: '#dce8ff', mid: '#2563eb', dark: '#0f2740', glow: '#60a5fa' },
];

const PRESET_COUNT = SPHERE_COLOR_PRESETS.length;

/** Возвращает случайный пресет оттенка сферы */
export function getRandomSphereColorPreset(): SphereColorPreset {
  return SPHERE_COLOR_PRESETS[Math.floor(Math.random() * PRESET_COUNT)];
}

/** Возвращает индекс пресета (0–7) для сохранения в БД */
export function getRandomSphereColorIndex(): number {
  return Math.floor(Math.random() * PRESET_COUNT);
}

/** Получить пресет по индексу или hex; при невалидном — дефолт */
export function getSphereColorPreset(indexOrHex: string | null | undefined): SphereColorPreset {
  if (indexOrHex == null || indexOrHex === '') {
    return SPHERE_COLOR_PRESETS[0];
  }
  const idx = parseInt(indexOrHex, 10);
  if (!Number.isNaN(idx) && idx >= 0 && idx < PRESET_COUNT) {
    return SPHERE_COLOR_PRESETS[idx];
  }
  // Если передан hex — используем как mid и генерируем остальное
  if (/^#[0-9a-fA-F]{6}$/.test(indexOrHex)) {
    return {
      highlight: '#ecf5ff',
      mid: indexOrHex,
      dark: '#0f2740',
      glow: indexOrHex,
    };
  }
  return SPHERE_COLOR_PRESETS[0];
}
