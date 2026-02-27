/** Ключ темы в localStorage */
export const THEME_STORAGE_KEY = 'noosphere-theme';
/** Ключ акцентного цвета */
export const ACCENT_STORAGE_KEY = 'noosphere-accent';
/** Прозрачность фона (0–1) */
export const BACKGROUND_OPACITY_KEY = 'noosphere-bg-opacity';
/** Сила размытия фона (px или 0) */
export const BACKGROUND_BLUR_KEY = 'noosphere-bg-blur';
/** Оттенок интерфейса: 0 = нейтральный, 1–360 = hue в градусах */
export const INTERFACE_TINT_KEY = 'noosphere-interface-tint';
/** Стиль светлой темы */
export const LIGHT_STYLE_KEY = 'noosphere-light-style';

export type ThemeMode = 'light' | 'dark';
export type LightStyle = 'soft' | 'bright' | 'muted';

/** Варианты светлой темы */
export const LIGHT_STYLE_PRESETS: { value: LightStyle; label: string; description?: string }[] = [
  { value: 'soft', label: 'Мягкая', description: 'Сероватые фоны, комфортно для глаз' },
  { value: 'bright', label: 'Яркая', description: 'Белый фон, максимальный контраст' },
  { value: 'muted', label: 'Приглушённая', description: 'Тёплый тон, меньше контраста' },
];

/** Пресеты оттенка интерфейса (подкрашивает фон и границы) */
export const INTERFACE_TINT_PRESETS = [
  { label: 'Нейтральный', hue: 0 },
  { label: 'Синий', hue: 220 },
  { label: 'Фиолетовый', hue: 270 },
  { label: 'Зелёный', hue: 142 },
  { label: 'Бирюзовый', hue: 174 },
  { label: 'Тёплый', hue: 30 },
  { label: 'Розовый', hue: 330 },
] as const;

/** Пресеты силы размытия (значение в px, 0 = выкл) */
export const BACKGROUND_BLUR_PRESETS = [
  { label: 'Лёгкое', value: 12 },
  { label: 'Среднее', value: 24 },
  { label: 'Сильное', value: 36 },
  { label: 'Выкл', value: 0 },
] as const;

/** Допустимые значения прозрачности фона */
export const BACKGROUND_OPACITY_PRESETS = [
  { label: 'Сплошной', value: 1 },
  { label: 'Почти сплошной', value: 0.95 },
  { label: 'Лёгкое стекло', value: 0.92 },
  { label: 'Стекло', value: 0.82 },
  { label: 'Сильная прозрачность', value: 0.7 },
] as const;

/** Палитра акцентов в стиле дизайн-систем (согласованные оттенки, контраст) */
export const ACCENT_PRESETS: { name: string; value: string; hover: string }[] = [
  { name: 'Синий', value: '#2563eb', hover: '#1d4ed8' },
  { name: 'Фиолетовый', value: '#8b5cf6', hover: '#7c3aed' },
  { name: 'Зелёный', value: '#22c55e', hover: '#16a34a' },
  { name: 'Бирюзовый', value: '#0d9488', hover: '#0f766e' },
  { name: 'Оранжевый', value: '#f97316', hover: '#ea580c' },
  { name: 'Розовый', value: '#ec4899', hover: '#db2777' },
  { name: 'Красный', value: '#ef4444', hover: '#dc2626' },
];

export function getStoredTheme(): ThemeMode {
  return 'dark';
}

export function getStoredAccent(): { value: string; hover: string } {
  if (typeof window === 'undefined') return { value: '#2563eb', hover: '#1d4ed8' };
  const raw = window.localStorage.getItem(ACCENT_STORAGE_KEY);
  if (!raw) return { value: '#2563eb', hover: '#1d4ed8' };
  try {
    const { value, hover } = JSON.parse(raw);
    if (value && hover) return { value, hover };
  } catch {}
  return { value: '#2563eb', hover: '#1d4ed8' };
}

export function applyTheme(_mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', 'dark');
  if (typeof window !== 'undefined') window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
}

export function applyAccent(value: string, hover: string) {
  document.documentElement.style.setProperty('--accent-primary', value);
  document.documentElement.style.setProperty('--accent-primary-hover', hover);
  const muted = value + '99'; /* ~60% opacity for muted */
  document.documentElement.style.setProperty('--accent-primary-muted', muted);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ACCENT_STORAGE_KEY, JSON.stringify({ value, hover }));
  }
}

export function getStoredBackgroundOpacity(): number {
  if (typeof window === 'undefined') return 0.95;
  const v = window.localStorage.getItem(BACKGROUND_OPACITY_KEY);
  const n = v ? parseFloat(v) : NaN;
  return Number.isFinite(n) && n >= 0.5 && n <= 1 ? n : 0.95;
}

export function applyBackgroundOpacity(value: number) {
  const opacity = Math.max(0.5, Math.min(1, value));
  document.documentElement.style.setProperty('--app-bg-opacity', String(opacity));
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(BACKGROUND_OPACITY_KEY, String(opacity));
  }
}

export function getStoredBackgroundBlur(): number {
  if (typeof window === 'undefined') return 24;
  const v = window.localStorage.getItem(BACKGROUND_BLUR_KEY);
  const n = v ? parseInt(v, 10) : NaN;
  if (Number.isFinite(n) && (n === 0 || n === 12 || n === 24 || n === 36)) return n;
  return 24;
}

export function applyBackgroundBlur(value: number) {
  const blur = value === 0 ? 0 : value === 12 || value === 24 || value === 36 ? value : 24;
  document.documentElement.style.setProperty('--app-blur', blur === 0 ? '0' : `${blur}px`);
  document.documentElement.setAttribute('data-bg-blur', blur === 0 ? 'none' : 'blur');
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(BACKGROUND_BLUR_KEY, String(blur));
  }
}

export function getStoredInterfaceTint(): number {
  if (typeof window === 'undefined') return 0;
  const v = window.localStorage.getItem(INTERFACE_TINT_KEY);
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n >= 0 && n <= 360 ? n : 0;
}

export function applyInterfaceTint(hue: number) {
  const h = Math.max(0, Math.min(360, hue));
  document.documentElement.style.setProperty('--interface-hue', String(h));
  document.documentElement.setAttribute('data-interface-tint', h > 0 ? 'true' : 'false');
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(INTERFACE_TINT_KEY, String(h));
  }
}

export function getStoredLightStyle(): LightStyle {
  if (typeof window === 'undefined') return 'soft';
  const v = window.localStorage.getItem(LIGHT_STYLE_KEY);
  if (v === 'bright' || v === 'muted' || v === 'soft') return v;
  return 'soft';
}

export function applyLightStyle(style: LightStyle) {
  document.documentElement.setAttribute('data-light-style', style);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LIGHT_STYLE_KEY, style);
  }
}

export function initTheme() {
  const mode: ThemeMode = 'dark';
  const accent = getStoredAccent();
  const bgOpacity = getStoredBackgroundOpacity();
  const bgBlur = getStoredBackgroundBlur();
  const interfaceTint = getStoredInterfaceTint();
  const lightStyle = getStoredLightStyle();
  document.documentElement.setAttribute('data-theme', mode);
  document.documentElement.setAttribute('data-light-style', lightStyle);
  document.documentElement.style.setProperty('--accent-primary', accent.value);
  document.documentElement.style.setProperty('--accent-primary-hover', accent.hover);
  document.documentElement.style.setProperty('--accent-primary-muted', accent.value + '99');
  document.documentElement.style.setProperty('--app-bg-opacity', String(bgOpacity));
  document.documentElement.style.setProperty('--app-blur', bgBlur === 0 ? '0' : `${bgBlur}px`);
  document.documentElement.setAttribute('data-bg-blur', bgBlur === 0 ? 'none' : 'blur');
  document.documentElement.style.setProperty('--interface-hue', String(interfaceTint));
  document.documentElement.setAttribute('data-interface-tint', interfaceTint > 0 ? 'true' : 'false');
}
