/**
 * Design tokens aligned with web app (app/globals.css).
 * Studio-* and neon/hover used for platform-card, sidebar, chat, inputs.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 30,
};

/** Как в мобильной веб-версии Сферы (max-width: 768px) */
export const mobileLayout = {
  /** .platform-card на мобильном */
  cardRadius: 20,
  cardPaddingVertical: 20,
  cardPaddingHorizontal: 16,
  /** .content-block-mobile */
  blockRadius: 16,
  blockPadding: 16,
  /** .page-padding-mobile / .main-mobile-padding */
  pagePadding: 16,
  pagePaddingBottom: 24,
  /** .app-container-glass на мобильном */
  containerMargin: 12,
  containerRadius: 12,
  /** Минимальная зона тапа (content-card, room-card-link и т.д.) */
  minTouchTarget: 44,
};

/** Единые отступы контента списков и экранов (как main-mobile-padding) */
export const screenLayout = {
  listContent: {
    padding: mobileLayout.pagePadding,
    paddingBottom: mobileLayout.pagePaddingBottom,
  },
  card: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.sm },
  cardCompact: {
    paddingVertical: mobileLayout.cardPaddingVertical,
    paddingHorizontal: mobileLayout.cardPaddingHorizontal,
    borderRadius: mobileLayout.cardRadius,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  /** Блок контента как .content-block-mobile */
  contentBlock: {
    padding: mobileLayout.blockPadding,
    borderRadius: mobileLayout.blockRadius,
    borderWidth: 1,
  },
  empty: { padding: spacing.xl, alignItems: 'center' as const },
  loadingCentered: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const },
  screenContainer: { flex: 1 },
};

/** Типографика для единообразия заголовков и текста */
export const typography = {
  title: { fontSize: 17, fontWeight: '600' as const },
  titleLarge: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 15 },
  bodySmall: { fontSize: 14 },
  caption: { fontSize: 13 },
};

/** Тени как в вебе: shadow-card и neon-glow (для карточек и кнопок) */
export const shadows = {
  /** Карточка: глубокая тень как .platform-card */
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  /** Неоновая подсветка акцента (как --neon-glow в globals.css) */
  neonGlow: (accentHex: string) => ({
    shadowColor: accentHex,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  }),
  /** Сильная неоновая подсветка (hover, как --neon-glow-strong) */
  neonGlowStrong: (accentHex: string) => ({
    shadowColor: accentHex,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  }),
};

/** Стиль акцентной кнопки как .glass-icon-btn-accent в вебе (подсветка) */
export const accentButtonShadow = (accentHex: string) => ({
  ...shadows.neonGlow(accentHex),
  borderWidth: 1,
  borderColor: accentHex + 'b3',
});

export const darkColors = {
  bgPrimary: '#1a1b1d',
  bgSecondary: '#191a1d',
  bgCard: '#1c1e21',
  bgHeader: '#131315',
  textPrimary: '#e4e6e9',
  textSecondary: '#a8aaaf',
  textMuted: '#7a7d84',
  accent: '#2563eb',
  accentHover: '#1d4ed8',
  accentMuted: '#60a5fa',
  border: '#2a2c30',
  borderSubtle: '#232529',
  bgAccent: '#404249',
  // Studio / platform-card, sidebar, panel
  studioPanelBg: '#25262a',
  studioPanelBorder: 'rgba(255,255,255,0.06)',
  studioCardBorder: 'rgba(74,144,226,0.2)',
  studioMetaColor: '#8a9bb5',
  // Focus, hover
  neonBorder: '#3b5a9e',
  hoverColor: '#3a3c42',
  hoverAccent: '#4a4d54',
  // Hero title gradient [start, end]
  studioTitleGradientColors: ['#ffffff', '#b0d0ff'] as [string, string],
};

export const lightColors = {
  bgPrimary: '#f2f3f5',
  bgSecondary: '#ffffff',
  bgCard: '#ffffff',
  bgHeader: '#f2f3f5',
  textPrimary: '#1e1f22',
  textSecondary: '#4e5058',
  textMuted: '#6d7078',
  accent: '#2563eb',
  accentHover: '#1d4ed8',
  accentMuted: '#60a5fa',
  border: '#d4d5d9',
  borderSubtle: '#c7c9ce',
  bgAccent: '#e3e4e8',
  studioPanelBg: '#ffffff',
  studioPanelBorder: 'rgba(0,0,0,0.06)',
  studioCardBorder: 'rgba(74,144,226,0.2)',
  studioMetaColor: '#4e5058',
  neonBorder: '#5b8ae8',
  hoverColor: '#e3e4e8',
  hoverAccent: '#d4d5d9',
  studioTitleGradientColors: ['#1e1f22', '#4a6f8a'] as [string, string],
};
