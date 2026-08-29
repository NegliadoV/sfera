/**
 * Rule-based движок модерации контента для Roominate.
 * Проверяет публикации по 6 критериям без использования внешних AI-сервисов.
 */

export type ModerationStatus = 'approved' | 'needs_review' | 'rejected';

export interface ModerationCriterion {
  /** Название критерия */
  name: string;
  /** Описание что проверяется */
  description: string;
  /** Оценка 0–20 */
  score: number;
  /** Максимально возможная оценка */
  maxScore: number;
  /** Пройдено ли */
  passed: boolean;
  /** Подробности */
  details: string;
}

export interface ModerationReport {
  /** Итоговый балл 0–100 */
  totalScore: number;
  /** Вердикт */
  status: ModerationStatus;
  /** Краткое резюме для автора */
  verdictReason: string;
  /** Подробный отчёт по каждому критерию */
  criteria: ModerationCriterion[];
  /** Флаги, которые сработали */
  triggeredFlags: string[];
  /** Время анализа */
  analyzedAt: Date;
}

// --- Стоп-слова и паттерны ---

const SPAM_KEYWORDS = [
  'купить', 'заказать', 'скидка', 'акция', 'распродажа', 'бесплатно',
  'выиграй', 'казино', 'ставки', 'кредит', 'займ', 'click here', 'buy now',
  'subscribe now', 'limited offer', 'act now', 'earn money', 'make money',
  'work from home', 'get rich', 'crypto pump', 'telegram канал',
  'подпишись', 'переходи по ссылке', 'жми', 'переходите',
];

import { scanMultilingualViolations } from './moderator-bot';

const CLICKBAIT_PATTERNS = [
  /ты не поверишь/i,
  /шок[!]?/i,
  /сенсация[!]?/i,
  /невероятно[!]?/i,
  /топ-?\d+\s+способ/i,
  /\d+\s+причин\s+почему/i,
  /вот что произошло/i,
  /you won't believe/i,
  /doctors hate/i,
  /this one trick/i,
];

const EXCESSIVE_CAPS_THRESHOLD = 0.4; // 40%+ заглавных → подозрительно
const MIN_TITLE_LENGTH = 5;
const MIN_BODY_LENGTH_FOR_ARTICLE = 50;
const MAX_URL_COUNT = 5; // больше 5 ссылок в тексте — спам

// Ключевые слова для профильных категорий комнат
const ROOM_KEYWORDS: Record<string, string[]> = {
  philosophy: ['философия', 'этика', 'мораль', 'сознание', 'бытие', 'истина', 'смысл', 'разум', 'квантовый', 'квантовая', 'нейрон', 'мозг', 'психология', 'познание', 'реальность', 'экзистенциал', 'метафизика', 'эпистемология', 'philosophy', 'ethics', 'consciousness', 'existence', 'meaning', 'quantum', 'mind', 'brain', 'neuron', 'reality', 'metaphysics', 'cognition', 'epistemology'],
  'science-tech': ['наука', 'исследование', 'технологии', 'ии', 'ai', 'ml', 'физика', 'биология', 'химия', 'space', 'research', 'study', 'data', 'algorithm'],
  urbanism: ['урбанистика', 'город', 'архитектура', 'транспорт', 'urban', 'city', 'architecture', 'transit', 'planning', 'infrastructure'],
  productivity: ['продуктивность', 'привычки', 'фокус', 'цели', 'тайм-менеджмент', 'productivity', 'habits', 'focus', 'goals', 'deep work', 'time management'],
  'art-design': ['дизайн', 'искусство', 'ux', 'ui', 'типографика', 'design', 'art', 'typography', 'creative', 'visual', 'aesthetic'],
  books: ['книга', 'литература', 'автор', 'чтение', 'book', 'literature', 'reading', 'author', 'novel', 'essay'],
  'nature-travel': ['природа', 'путешествие', 'экология', 'nature', 'travel', 'ecology', 'wildlife', 'explore', 'geography'],
  learning: ['обучение', 'образование', 'курс', 'учёба', 'learning', 'education', 'course', 'study', 'skill', 'knowledge'],
  'news-politics': ['политика', 'новости', 'выборы', 'закон', 'politics', 'news', 'election', 'government', 'policy', 'society'],
};

// --- Вспомогательные функции ---

function countUrls(text: string): number {
  const urlPattern = /https?:\/\/[^\s]+/g;
  return (text.match(urlPattern) || []).length;
}

function capsRatio(text: string): number {
  const letters = text.replace(/[^a-zA-Zа-яА-Я]/g, '');
  if (letters.length === 0) return 0;
  const upper = text.replace(/[^A-ZА-Я]/g, '').length;
  return upper / letters.length;
}

function hasSpamKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  return SPAM_KEYWORDS.filter(kw => lower.includes(kw));
}

function hasClickbait(text: string): boolean {
  return CLICKBAIT_PATTERNS.some(p => p.test(text));
}

function isTopicRelevant(title: string, body: string | null, universeSlug: string): boolean {
  const keywords = ROOM_KEYWORDS[universeSlug];
  if (!keywords) return true; // неизвестная комната — не штрафуем
  const combined = (title + ' ' + (body || '')).toLowerCase();
  return keywords.some(kw => combined.includes(kw.toLowerCase()));
}

// --- Основная функция модерации ---

export interface ContentToModerate {
  id: string;
  title: string;
  body: string | null;
  url: string | null;
  type: string;
  universeSlug: string;
  authorId: string;
}

export function moderateContent(item: ContentToModerate): ModerationReport {
  const { title, body, url, type, universeSlug } = item;
  const fullText = [title, body, url].filter(Boolean).join(' ');
  const triggeredFlags: string[] = [];
  const criteria: ModerationCriterion[] = [];

  // --- 1. Соответствие теме комнаты (0–20) ---
  const topicRelevant = isTopicRelevant(title, body, universeSlug);
  const topicScore = topicRelevant ? 20 : 8;
  if (!topicRelevant) triggeredFlags.push('off_topic');
  criteria.push({
    name: 'topic_relevance',
    description: 'Соответствие теме комнаты',
    score: topicScore,
    maxScore: 20,
    passed: topicRelevant,
    details: topicRelevant
      ? 'Контент соответствует тематике комнаты'
      : `Контент не содержит ключевых слов для комнаты "${universeSlug}"`,
  });

  // --- 2. Качество контента (0–20) ---
  let qualityScore = 20;
  const qualityIssues: string[] = [];

  if (title.length < MIN_TITLE_LENGTH) {
    qualityScore -= 10;
    qualityIssues.push(`слишком короткий заголовок (${title.length} символов)`);
    triggeredFlags.push('short_title');
  }
  if (title.length > 250) {
    qualityScore -= 5;
    qualityIssues.push('заголовок слишком длинный (>250 символов)');
  }
  if (type === 'article' && (!body || body.length < MIN_BODY_LENGTH_FOR_ARTICLE)) {
    qualityScore -= 8;
    qualityIssues.push('статья без текста или с очень коротким текстом');
    triggeredFlags.push('empty_article');
  }
  if (!url && !body) {
    qualityScore -= 10;
    qualityIssues.push('нет ни ссылки, ни текста');
    triggeredFlags.push('no_content');
  }
  qualityScore = Math.max(0, qualityScore);

  criteria.push({
    name: 'content_quality',
    description: 'Качество и полнота материала',
    score: qualityScore,
    maxScore: 20,
    passed: qualityScore >= 12,
    details: qualityIssues.length === 0 ? 'Контент имеет достаточное качество' : `Проблемы: ${qualityIssues.join(', ')}`,
  });

  // --- 3. Тон и стиль (0–20) ---
  let toneScore = 20;
  const toneIssues: string[] = [];

  const violationScan = scanMultilingualViolations(fullText);
  if (violationScan.hasViolation) {
    toneScore -= 20;
    toneIssues.push(`обнаружен запрещенный контент (${violationScan.detectedWords.slice(0, 3).join(', ')})`);
    triggeredFlags.push(violationScan.category);
    triggeredFlags.push('profanity');
  }

  if (hasClickbait(title)) {
    toneScore -= 8;
    toneIssues.push('кликбейтный заголовок');
    triggeredFlags.push('clickbait');
  }
  if (capsRatio(title) > EXCESSIVE_CAPS_THRESHOLD) {
    toneScore -= 5;
    toneIssues.push('чрезмерное использование заглавных букв в заголовке');
    triggeredFlags.push('excessive_caps');
  }
  if (title.split('!').length - 1 > 2) {
    toneScore -= 3;
    toneIssues.push('много восклицательных знаков');
  }
  toneScore = Math.max(0, toneScore);

  criteria.push({
    name: 'tone',
    description: 'Тон и стиль публикации',
    score: toneScore,
    maxScore: 20,
    passed: toneScore >= 12,
    details: toneIssues.length === 0 ? 'Нейтральный и конструктивный тон' : `Проблемы: ${toneIssues.join(', ')}`,
  });

  // --- 4. Отсутствие спама/рекламы (0–20) ---
  let spamScore = 20;
  const spamIssues: string[] = [];
  const spamWords = hasSpamKeywords(fullText);
  const urlCount = countUrls(fullText);

  if (spamWords.length >= 3) {
    spamScore -= 15;
    spamIssues.push(`спам-ключевые слова: ${spamWords.slice(0, 3).join(', ')}`);
    triggeredFlags.push('spam_keywords');
  } else if (spamWords.length >= 1) {
    spamScore -= 5;
    spamIssues.push(`коммерческие слова: ${spamWords.join(', ')}`);
  }
  if (urlCount > MAX_URL_COUNT) {
    spamScore -= 10;
    spamIssues.push(`слишком много ссылок: ${urlCount}`);
    triggeredFlags.push('too_many_urls');
  }
  spamScore = Math.max(0, spamScore);

  criteria.push({
    name: 'no_spam',
    description: 'Отсутствие спама и рекламы',
    score: spamScore,
    maxScore: 20,
    passed: spamScore >= 12,
    details: spamIssues.length === 0 ? 'Признаков спама не обнаружено' : `Признаки: ${spamIssues.join(', ')}`,
  });

  // --- 5. Достоверность (0–20) ---
  let credibilityScore = 20;
  const credibilityIssues: string[] = [];

  const sensationalism = [/!{3,}/, /\?\?\?/, /срочно!!/i, /breaking!!/i, /ВНИМАНИЕ!!/];
  const sensationalCount = sensationalism.filter(p => p.test(fullText)).length;
  if (sensationalCount >= 2) {
    credibilityScore -= 10;
    credibilityIssues.push('сенсационалистский стиль');
    triggeredFlags.push('sensationalism');
  }

  criteria.push({
    name: 'no_misinformation',
    description: 'Признаков фейков или манипуляции',
    score: credibilityScore,
    maxScore: 20,
    passed: credibilityScore >= 12,
    details: credibilityIssues.length === 0 ? 'Явных признаков дезинформации не обнаружено' : `Проблемы: ${credibilityIssues.join(', ')}`,
  });

  // --- 6. Читаемость (0–20) ---
  let readabilityScore = 20;
  const readabilityIssues: string[] = [];

  // Проверка кириллицы или латиницы (не каша символов)
  const hasReadableText = /[а-яa-z]{3,}/i.test(title);
  if (!hasReadableText) {
    readabilityScore -= 15;
    readabilityIssues.push('заголовок содержит только символы или цифры');
    triggeredFlags.push('unreadable_title');
  }
  // Повторяющиеся слова
  const words = title.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  if (words.length > 4 && uniqueWords.size / words.length < 0.5) {
    readabilityScore -= 5;
    readabilityIssues.push('много повторяющихся слов');
  }
  readabilityScore = Math.max(0, readabilityScore);

  criteria.push({
    name: 'language_quality',
    description: 'Читаемость и грамотность',
    score: readabilityScore,
    maxScore: 20,
    passed: readabilityScore >= 12,
    details: readabilityIssues.length === 0 ? 'Текст читаемый и понятный' : `Проблемы: ${readabilityIssues.join(', ')}`,
  });

  // --- Итог ---
  // Баллы суммируем и ограничиваем диапазоном 0–100
  const rawScore = criteria.reduce((sum, c) => sum + c.score, 0);
  const totalScore = Math.min(100, Math.max(0, rawScore));

  // Жёсткие флаги — переопределяют вердикт независимо от счёта
  const HARD_REJECT_FLAGS = [
    'profanity',
    'hate_speech',
    'scam_spam',
    'spam_keywords',
    'too_many_urls',
    'unreadable_title',
    'no_content',
  ];
  const HARD_REVIEW_FLAGS = ['clickbait', 'empty_article', 'sensationalism', 'excessive_caps'];

  const hasHardReject = triggeredFlags.some(f => HARD_REJECT_FLAGS.includes(f));
  const hasHardReview = triggeredFlags.some(f => HARD_REVIEW_FLAGS.includes(f));

  let status: ModerationStatus;
  let verdictReason: string;

  if (hasHardReject || totalScore < 40) {
    status = 'rejected';
    const mainProblems = criteria.filter(c => !c.passed).map(c => c.description);
    const hardFlagsHit = triggeredFlags.filter(f => HARD_REJECT_FLAGS.includes(f));
    verdictReason = `Контент отклонён. Оценка: ${totalScore}/100.${
      hardFlagsHit.length ? ` Критические нарушения: ${hardFlagsHit.join(', ')}.` : ''
    }${mainProblems.length ? ` Проблемные критерии: ${mainProblems.join('; ')}.` : ''}`;
  } else if (hasHardReview || totalScore < 70) {
    status = 'needs_review';
    const reviewFlagsHit = triggeredFlags.filter(f => HARD_REVIEW_FLAGS.includes(f));
    verdictReason = `Контент требует ручной проверки. Оценка: ${totalScore}/100.${
      reviewFlagsHit.length ? ` Замечания: ${reviewFlagsHit.join(', ')}.` : ''
    }`;
  } else {
    status = 'approved';
    verdictReason = `Контент одобрен. Оценка: ${totalScore}/100.`;
  }

  return {
    totalScore,
    status,
    verdictReason,
    criteria,
    triggeredFlags,
    analyzedAt: new Date(),
  };
}
