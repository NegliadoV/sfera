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
  // 0: Violet Cosmic Portal (Neon Purple & Cyan)
  { highlight: '#e9d5ff', mid: '#a855f7', dark: '#3b0764', glow: '#c084fc' },
  // 1: Supernova Amber (Gold & Crimson)
  { highlight: '#fef08a', mid: '#f59e0b', dark: '#78350f', glow: '#fbbf24' },
  // 2: Emerald Cyber (Electric Mint & Cyan)
  { highlight: '#a7f3d0', mid: '#10b981', dark: '#064e3b', glow: '#34d399' },
  // 3: Sapphire Hyperdrive (Deep Blue & Ultramarine)
  { highlight: '#bae6fd', mid: '#0284c7', dark: '#0c4a6e', glow: '#38bdf8' },
  // 4: Rose Nebula (Neon Pink & Sunset Violet)
  { highlight: '#fbcfe8', mid: '#ec4899', dark: '#831843', glow: '#f472b6' },
  // 5: Deep Plasma / Void (Electric Indigo & Amethyst)
  { highlight: '#c7d2fe', mid: '#6366f1', dark: '#1e1b4b', glow: '#818cf8' },
  // 6: Solar Flare (Sunburst Gold & Ruby Red)
  { highlight: '#ffedd5', mid: '#f97316', dark: '#7c2d12', glow: '#fb923c' },
  // 7: Teal Nexus (Aquamarine & Neon Cyan)
  { highlight: '#99f6e4', mid: '#14b8a6', dark: '#134e4a', glow: '#2dd4bf' },
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
