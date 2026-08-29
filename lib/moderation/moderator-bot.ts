/**
 * Интеллектуальный глобальный бот-модератор Roominate.
 * Обеспечивает строгую мультиязычную модерацию:
 * - Русский и славянские языки
 * - Английский и международная латиница (NSFW / Adult / Profanity / Spam)
 * - Вьетнамский 🇻🇳 (Tiếng Việt: tình dục, khiêu dâm, chửi thề, cờ bạc)
 * - Азиатские языки (Китайский 🇨🇳, Японский 🇯🇵, Корейский 🇰🇷)
 * - Европейские языки (Испанский 🇪🇸, Немецкий 🇩🇪, Французский 🇫🇷, Итальянский 🇮🇹)
 */

import {
  ASIAN_PROFANITY_PATTERNS,
  VIETNAMESE_UNTONED_PATTERNS,
  ENGLISH_GLOBAL_PATTERNS,
  RUSSIAN_PATTERNS,
  EUROPEAN_PATTERNS,
  normalizeGlobalText,
} from './multilingual-dict';

export interface ModerationResult {
  /** Разрешена ли публикация / создание */
  isAllowed: boolean;
  /** Оценка безопасности (0 - 100) */
  score: number;
  /** Категория нарушения */
  category: 'clean' | 'profanity' | 'nsfw' | 'scam_spam' | 'hate_speech' | 'low_quality' | 'invalid_slug';
  /** Краткая причина */
  reasonRu: string;
  /** Детальное вежливое сообщение от имени Бот-модератора */
  botFeedback: string;
  /** Найденные триггеры / запрещенные слова */
  detectedTriggers: string[];
  /** Язык / регион обнаруженного нарушения */
  detectedRegion?: string;
}

// Жёсткие подстроки для моментального отлова в любом регистре и контексте
const HARD_SUBSTRING_TRIGGERS: Array<{ word: string; category: ModerationResult['category']; reason: string }> = [
  // Английский / Латиница (Adult / NSFW / Profanity)
  { word: 'porn', category: 'nsfw', reason: 'Adult / NSFW content (porn)' },
  { word: 'porno', category: 'nsfw', reason: 'Adult / NSFW content (porno)' },
  { word: 'xxx', category: 'nsfw', reason: 'Adult / NSFW content (xxx)' },
  { word: 'hentai', category: 'nsfw', reason: 'Adult / NSFW content (hentai)' },
  { word: 'onlyfans', category: 'nsfw', reason: 'Adult / NSFW content (onlyfans)' },
  { word: 'camgirl', category: 'nsfw', reason: 'Adult / NSFW content (camgirl)' },
  { word: 'blowjob', category: 'nsfw', reason: 'Adult / NSFW content (blowjob)' },
  { word: 'fuck', category: 'profanity', reason: 'Profanity (fuck)' },
  { word: 'bitch', category: 'profanity', reason: 'Profanity (bitch)' },
  { word: 'pussy', category: 'nsfw', reason: 'Adult / NSFW content (pussy)' },
  { word: 'cunt', category: 'profanity', reason: 'Profanity (cunt)' },
  { word: 'dick', category: 'nsfw', reason: 'Adult / NSFW content (dick)' },

  // Русский (Мат и 18+)
  { word: 'порно', category: 'nsfw', reason: '18+ / Порнография' },
  { word: 'секс', category: 'nsfw', reason: '18+ / Сексуальный контент' },
  { word: 'пиздец', category: 'profanity', reason: 'Нецензурная брань (пиздец)' },
  { word: 'пиздц', category: 'profanity', reason: 'Нецензурная брань (пиздц)' },
  { word: 'пизда', category: 'profanity', reason: 'Нецензурная брань (пизда)' },
  { word: 'хуй', category: 'profanity', reason: 'Нецензурная брань (хуй)' },
  { word: 'хуе', category: 'profanity', reason: 'Нецензурная брань (хуе)' },
  { word: 'ебать', category: 'profanity', reason: 'Нецензурная брань (ебать)' },
  { word: 'ебал', category: 'profanity', reason: 'Нецензурная брань (ебал)' },
  { word: 'заеб', category: 'profanity', reason: 'Нецензурная брань (заеб)' },
  { word: 'блядь', category: 'profanity', reason: 'Нецензурная брань (блядь)' },
  { word: 'блять', category: 'profanity', reason: 'Нецензурная брань (блять)' },

  // Вьетнамский (🇻🇳 Tiếng Việt)
  { word: 'khiêu dâm', category: 'nsfw', reason: 'Vietnamese Adult / NSFW (khiêu dâm)' },
  { word: 'khieudam', category: 'nsfw', reason: 'Vietnamese Adult / NSFW (khieudam)' },
  { word: 'phim sex', category: 'nsfw', reason: 'Vietnamese Adult / NSFW (phim sex)' },
  { word: 'phim heo', category: 'nsfw', reason: 'Vietnamese Adult / NSFW (phim heo)' },
  { word: 'gái gọi', category: 'nsfw', reason: 'Vietnamese Escort / NSFW (gái gọi)' },
  { word: 'gaigoi', category: 'nsfw', reason: 'Vietnamese Escort / NSFW (gaigoi)' },
  { word: 'địt mẹ', category: 'profanity', reason: 'Vietnamese Profanity (địt mẹ)' },
  { word: 'dit me', category: 'profanity', reason: 'Vietnamese Profanity (dit me)' },
  { word: 'đụ má', category: 'profanity', reason: 'Vietnamese Profanity (đụ má)' },
  { word: 'du ma', category: 'profanity', reason: 'Vietnamese Profanity (du ma)' },
  { word: 'tài xỉu', category: 'scam_spam', reason: 'Vietnamese Gambling (tài xỉu)' },
  { word: 'taixiu', category: 'scam_spam', reason: 'Vietnamese Gambling (taixiu)' },

  // Азия (Китайский, Японский, Корейский)
  { word: '色情', category: 'nsfw', reason: 'Chinese Adult / NSFW (色情)' },
  { word: '淫秽', category: 'nsfw', reason: 'Chinese Adult / NSFW (淫秽)' },
  { word: '操你', category: 'profanity', reason: 'Chinese Profanity (操你)' },
  { word: '傻逼', category: 'profanity', reason: 'Chinese Profanity (傻逼)' },
  { word: 'ポルノ', category: 'nsfw', reason: 'Japanese Adult / NSFW (ポルノ)' },
  { word: 'エロ', category: 'nsfw', reason: 'Japanese Adult / NSFW (エロ)' },
  { word: 'セックス', category: 'nsfw', reason: 'Japanese Adult / NSFW (セックス)' },
  { word: '死ね', category: 'hate_speech', reason: 'Japanese Abuse / Death threat (死ね)' },
  { word: '포르노', category: 'nsfw', reason: 'Korean Adult / NSFW (포르노)' },
  { word: '야동', category: 'nsfw', reason: 'Korean Adult / NSFW (야동)' },
  { word: '섹스', category: 'nsfw', reason: 'Korean Adult / NSFW (섹스)' },
  { word: '시발', category: 'profanity', reason: 'Korean Profanity (시발)' },
  { word: '개새끼', category: 'profanity', reason: 'Korean Profanity (개새끼)' },
];

/**
 * Комплексное мультиязычное сканирование текста.
 */
export function scanMultilingualViolations(text: string): {
  hasViolation: boolean;
  category: ModerationResult['category'];
  detectedWords: string[];
  reason: string;
} {
  if (!text || typeof text !== 'string') {
    return { hasViolation: false, category: 'clean', detectedWords: [], reason: '' };
  }

  const detectedWords = new Set<string>();
  let primaryCategory: ModerationResult['category'] = 'clean';
  let primaryReason = '';

  const rawLower = text.toLowerCase();
  const { normalized, condensed, noSeparators, unaccented } = normalizeGlobalText(text);

  // 1. Быстрая проверка жестких подстрок по всем формам текста
  for (const item of HARD_SUBSTRING_TRIGGERS) {
    if (
      rawLower.includes(item.word) ||
      normalized.includes(item.word) ||
      condensed.includes(item.word) ||
      noSeparators.includes(item.word) ||
      unaccented.includes(item.word)
    ) {
      detectedWords.add(item.word);
      if (primaryCategory === 'clean') {
        primaryCategory = item.category;
        primaryReason = item.reason;
      }
    }
  }

  // 2. Азиатские языки (CJK + Вьетнамский с диакритикой)
  for (const asian of ASIAN_PROFANITY_PATTERNS) {
    const matches = text.match(asian.pattern) || normalized.match(asian.pattern) || unaccented.match(asian.pattern);
    if (matches) {
      matches.forEach((w) => detectedWords.add(w));
      if (primaryCategory === 'clean') {
        primaryCategory = 'profanity';
        primaryReason = asian.reason;
      }
    }
  }

  // 3. Вьетнамский без диакритики
  for (const pattern of VIETNAMESE_UNTONED_PATTERNS) {
    const matches = unaccented.match(pattern) || noSeparators.match(pattern);
    if (matches) {
      matches.forEach((w) => detectedWords.add(w.toLowerCase()));
      if (primaryCategory === 'clean') {
        primaryCategory = 'profanity';
        primaryReason = 'Vietnamese Profanity / NSFW (Tiếng Việt)';
      }
    }
  }

  // 4. Английский и международный список
  for (const pattern of ENGLISH_GLOBAL_PATTERNS) {
    const matches =
      text.match(pattern) ||
      normalized.match(pattern) ||
      condensed.match(pattern) ||
      unaccented.match(pattern);
    if (matches) {
      matches.forEach((w) => detectedWords.add(w.toLowerCase()));
      if (primaryCategory === 'clean') {
        primaryCategory = 'profanity';
        primaryReason = 'English / International Profanity or NSFW';
      }
    }
  }

  // 5. Русский и славянские языки
  for (const pattern of RUSSIAN_PATTERNS) {
    const matches =
      text.match(pattern) ||
      normalized.match(pattern) ||
      condensed.match(pattern);
    if (matches) {
      matches.forEach((w) => detectedWords.add(w.toLowerCase()));
      if (primaryCategory === 'clean') {
        primaryCategory = 'profanity';
        primaryReason = 'Russian / Slavic Profanity or NSFW';
      }
    }
  }

  // 6. Европейские языки
  for (const pattern of EUROPEAN_PATTERNS) {
    const matches = text.match(pattern) || normalized.match(pattern) || unaccented.match(pattern);
    if (matches) {
      matches.forEach((w) => detectedWords.add(w.toLowerCase()));
      if (primaryCategory === 'clean') {
        primaryCategory = 'profanity';
        primaryReason = 'European Profanity';
      }
    }
  }

  return {
    hasViolation: detectedWords.size > 0,
    category: primaryCategory === 'clean' && detectedWords.size > 0 ? 'profanity' : primaryCategory,
    detectedWords: Array.from(detectedWords),
    reason: primaryReason,
  };
}

/**
 * Валидация создания или редактирования сферы/комнаты (Universe).
 */
export function validateUniverseCreation(params: {
  name: string;
  description?: string | null;
  slug?: string | null;
}): ModerationResult {
  const { name, description, slug } = params;
  const fullNameAndDesc = `${name || ''} ${description || ''} ${slug || ''}`.trim();

  // 1. Проверка на пустоту и минимальную длину
  if (!name || name.trim().length < 2) {
    return {
      isAllowed: false,
      score: 0,
      category: 'low_quality',
      reasonRu: 'Слишком короткое название сферы (минимум 2 символа)',
      botFeedback:
        '🤖 Бот-модератор: Название комнаты должно содержать минимум 2 понятных символа.',
      detectedTriggers: [],
    };
  }

  // 2. Проверка на бессмысленный slug (например "-" или "---")
  if (slug && /^[-_.\s]+$/.test(slug)) {
    return {
      isAllowed: false,
      score: 10,
      category: 'invalid_slug',
      reasonRu: 'Некорректный идентификатор (slug) сферы',
      botFeedback:
        '🤖 Бот-модератор: Адрес (slug) не может состоять только из дефисов или спецсимволов.',
      detectedTriggers: [slug],
    };
  }

  // 3. Мультиязычное сканирование (все языки + Азия + Вьетнам)
  const scan = scanMultilingualViolations(fullNameAndDesc);
  if (scan.hasViolation) {
    const wordsList = scan.detectedWords.slice(0, 3).join(', ');
    return {
      isAllowed: false,
      score: 0,
      category: scan.category,
      reasonRu: `Название или описание нарушает правила модерации: обнаружен запрещенный контент (${wordsList})`,
      botFeedback: `🤖 Бот-модератор: Создание комнаты отклонено. Название «${name}» нарушает международные правила платформы (обнаружен 18+ контент, нецензурная лексика или спам: ${wordsList}). Roominate предназначен для интеллектуальных и тематических сообществ.`,
      detectedTriggers: scan.detectedWords,
      detectedRegion: scan.reason,
    };
  }

  return {
    isAllowed: true,
    score: 100,
    category: 'clean',
    reasonRu: 'Проверка пройдена',
    botFeedback: '🤖 Бот-модератор: Название и описание соответствуют стандартам сообщества.',
    detectedTriggers: [],
  };
}

/**
 * Валидация создания публикации/поста (Content).
 */
export function validateContentCreation(params: {
  title: string;
  body?: string | null;
  url?: string | null;
  type?: string | null;
}): ModerationResult {
  const { title, body, url } = params;
  const fullText = `${title || ''} ${body || ''} ${url || ''}`.trim();

  if (!title || title.trim().length < 3) {
    return {
      isAllowed: false,
      score: 0,
      category: 'low_quality',
      reasonRu: 'Слишком короткий заголовок публикации',
      botFeedback:
        '🤖 Бот-модератор: Заголовок публикации должен содержать осмысленный текст не менее 3 символов.',
      detectedTriggers: [],
    };
  }

  const scan = scanMultilingualViolations(fullText);
  if (scan.hasViolation) {
    const wordsList = scan.detectedWords.slice(0, 3).join(', ');
    return {
      isAllowed: false,
      score: 0,
      category: scan.category,
      reasonRu: `Публикация содержит запрещенный или 18+ контент (${wordsList})`,
      botFeedback: `🤖 Бот-модератор: Публикация отклонена. В материале обнаружена ненормативная лексика, 18+ контент или спам (${wordsList}).`,
      detectedTriggers: scan.detectedWords,
      detectedRegion: scan.reason,
    };
  }

  return {
    isAllowed: true,
    score: 100,
    category: 'clean',
    reasonRu: 'Проверка пройдена',
    botFeedback: '🤖 Бот-модератор: Публикация одобрена.',
    detectedTriggers: [],
  };
}

/**
 * Валидация комментария.
 */
export function validateCommentCreation(body: string): ModerationResult {
  if (!body || body.trim().length === 0) {
    return {
      isAllowed: false,
      score: 0,
      category: 'low_quality',
      reasonRu: 'Текст комментария пуст',
      botFeedback: '🤖 Бот-модератор: Комментарий не может быть пустым.',
      detectedTriggers: [],
    };
  }

  const scan = scanMultilingualViolations(body);
  if (scan.hasViolation) {
    const wordsList = scan.detectedWords.slice(0, 3).join(', ');
    return {
      isAllowed: false,
      score: 0,
      category: scan.category,
      reasonRu: `Комментарий содержит нецензурную лексику (${wordsList})`,
      botFeedback: `🤖 Бот-модератор: Комментарий отклонен. Обнаружена нецензурная или оскорбительная брань (${wordsList}). Соблюдайте уважительный тон.`,
      detectedTriggers: scan.detectedWords,
      detectedRegion: scan.reason,
    };
  }

  return {
    isAllowed: true,
    score: 100,
    category: 'clean',
    reasonRu: 'Проверка пройдена',
    botFeedback: '🤖 Бот-модератор: Комментарий одобрен.',
    detectedTriggers: [],
  };
}
