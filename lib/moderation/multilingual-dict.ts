/**
 * Глобальный мультиязычный словарь и паттерны модерации.
 * Включает:
 * - Русский и славянские языки (мат, обсценная лексика, эвфемизмы)
 * - Английский и международная латиница (NSFW, profanity, violence, scam)
 * - Вьетнамский (Tiếng Việt: tình dục, khiêu dâm, chửi thề, cờ bạc)
 * - Китайский (Simplified & Traditional: 色情, 赌博, 侮辱, 违禁)
 * - Японский (Kanji, Hiragana, Katakana: ポルノ, エロ, 誹謗中傷, 違法)
 * - Корейский (Hangul: 포르노, 성인, 욕설, 도박)
 * - Европейские языки (испанский, французский, немецкий, итальянский, португальский)
 */

// ============================================================================
// 1. АЗИАТСКИЕ ЯЗЫКИ (CJK + Вьетнамский)
// ============================================================================

export const ASIAN_PROFANITY_PATTERNS: Array<{ lang: string; pattern: RegExp; reason: string }> = [
  // --- ВЬЕТНАМСКИЙ (Tiếng Việt с диакритикой) ---
  {
    lang: 'vi',
    pattern: /(khiêu dâm|phim sex|phim heo|gái gọi|gái bao|khoả thân|khỏa thân|bán dâm|mua dâm|massage kích dục|thủ dâm|dâm đãng|loạn luân|giao cấu|địt mẹ|địt con mẹ|địt cụ|đụ má|đụ mẹ|đĩ mẹ|con đĩ|vãi lồn|vãi cặc|thằng chó|chó đẻ|ngu vãi|đánh bạc|cá độ|cờ bạc|lô đề|soi cầu|tài xỉu|nổ hũ|game bài đổi thưởng|ma túy|cần sa|thuốc lắc)/iu,
    reason: 'Vietnamese NSFW / Profanity / Gambling (Tiếng Việt)',
  },
  // --- КИТАЙСКИЙ (Упрощенный и Традиционный) ---
  {
    lang: 'zh',
    pattern: /(色情|淫秽|裸体|黄片|幼女|援交|约炮|做爱|性交|阴茎|阴道|鸡巴|肏你|操你|傻逼|煞笔|脑残|贱人|狗日|王八蛋|死全家|去死|赌博|六合彩|百家乐|老虎机|毒品|海洛因|冰毒|大麻|枪支|发票|代开)/iu,
    reason: 'Chinese NSFW / Profanity / Scam',
  },
  // --- ЯПОНСКИЙ (Кандзи, Хирагана, Катакана) ---
  {
    lang: 'ja',
    pattern: /(ポルノ|エロ|成人向け|セックス|オナニー|風俗|売春|援交|ちんこ|まんこ|クソ|死ね|殺す|バカ|アホ|ガイジ|キチガイ|カジノ|闇バイト|違法|麻薬|覚醒剤|大麻)/iu,
    reason: 'Japanese NSFW / Profanity / Scam',
  },
  // --- КОРЕЙСКИЙ (Хангыль) ---
  {
    lang: 'ko',
    pattern: /(포르노|야동|성인물|섹스|자위|조건만남|성매매|성폭행|보지|자지|시발|씨발|개새끼|지랄|병신|존나|좆|닥쳐|죽어|도박|바카라|토토|마약|대마초|필로폰)/iu,
    reason: 'Korean NSFW / Profanity / Scam',
  },
];

// Вьетнамский без диакритики (dit me, du ma, gai goi, tai xiu, etc.)
export const VIETNAMESE_UNTONED_PATTERNS: RegExp[] = [
  /\b(phim sex|phim heo|gai goi|gai bao|khoa than|ban dam|mua dam|thu dam|dam dang|loan luan|giao cau)\b/i,
  /\b(dit me|dit con me|dit cu|du ma|du me|di me|con di|vai lon|vai cac|thang cho|cho de|ngu vai|danh bac|ca do|co bac|lo de|soi cau|tai xiu|no hu|game bai doi thuong|ma tuy|can sa|thuoc lac)\b/i,
  /\b(chich|xoac|dit|du|lon|cac|buoi|dai|vcl|vkl|dcm|clgt)\b/i,
];

// ============================================================================
// 2. АНГЛИЙСКИЙ И МЕЖДУНАРОДНАЯ ЛАТИНИЦА (NSFW, Profanity, Scam, Hate Speech)
// ============================================================================

export const ENGLISH_GLOBAL_PATTERNS: RegExp[] = [
  // NSFW & Pornography
  /\b(porn|porno|pornography|xxx|nsfw|hentai|camgirl|onlyfans|nude|nudes|naked|erotic|erotica|gangbang|milf|blowjob|handjob|cumshot|deepthroat|creampie|anal|dildo|vibrator|escort|hooker|prostitute|incest|pedophile|pedophilia)\b/i,
  /\b(sex|sexy|hardcore|boobs|tits|titties|pussy|vagina|penis|dick|cock|clitoris|clit|testicles|orgasm|masturbation|fetish|bdsm|squirt)\b/i,
  
  // Severe profanity & insults
  /\b(fuck|fucking|fucked|fucker|motherfucker|motherfucking|cunt|bitch|bitches|bitching|asshole|bastard|twat|wanker|jackass|dipshit|dickhead|cockhead)\b/i,
  /\b(nigger|nigga|faggot|retard|kike|chink|spic|whore|slut|skank)\b/i,

  // Scams & illegal & pharma spam
  /\b(casino|gambling|slots|bet365|1xbet|crypto pump|free bitcoin|crack cocaine|heroin|methamphetamine|fentanyl|buy weed|darknet|hitman|viagra|cialis)\b/i,
];

// ============================================================================
// 3. РУССКИЙ И СЛАВЯНСКИЕ ЯЗЫКИ (Мат, обсценная лексика, 18+)
// ============================================================================

const CYR_START = '(?:^|[^а-яёa-z0-9_])';
const CYR_END = '(?=[^а-яёa-z0-9_]|$)';

export const RUSSIAN_PATTERNS: RegExp[] = [
  // Корень "хуй" / "хуе" / "хуя" / "похуй" / "нах"
  new RegExp(`${CYR_START}([оа-яёa-z]*х[уy][йеёяюиie][а-яёa-z]*)${CYR_END}`, 'gi'),
  new RegExp(`${CYR_START}([оа-яёa-z]*х[уy]л[еиie][а-яёa-z]*)${CYR_END}`, 'gi'),
  new RegExp(`${CYR_START}(пох|нах|нахуй|похуй|похую|дохуя|нихуя|охуеть|охуел|охуенн[а-яё]*|хуйло|хуила|хуесос)${CYR_END}`, 'gi'),

  // Корень "пизд" / "пиздц" / "пизда"
  new RegExp(`${CYR_START}([оа-яёa-z]*п[иieеё][з3z][дd][а-яё0-9a-z]*)${CYR_END}`, 'gi'),
  new RegExp(`${CYR_START}([оа-яёa-z]*п[иieеё][з3z][дd][цсcz][а-яё0-9a-z]*)${CYR_END}`, 'gi'),
  new RegExp(`${CYR_START}(пизда|пиздец|пиздц|пиздюк|пиздабол|пиздатый|пиздить|спиздил|впизду|распиздяй)${CYR_END}`, 'gi'),

  // Корень "еб" / "ёб" / "ебат" / "заеб"
  new RegExp(`${CYR_START}([оа-яёa-z]*[еёe][бb][а-яё0-9a-z]*)${CYR_END}`, 'gi'),
  new RegExp(`${CYR_START}([оа-яёa-z]*[иiеeё][бb][а-яё0-9a-z]*)${CYR_END}`, 'gi'),
  new RegExp(`${CYR_START}(ебать|ебал|ебу|ебаный|заебал|выебал|уебок|долбоеб|въебал|проебал|переебал|неебический)${CYR_END}`, 'gi'),

  // Корень "бля" / "бляд" / "блять"
  new RegExp(`${CYR_START}([оа-яёa-z]*бл[яяa][дdтt][а-яёa-z]*)${CYR_END}`, 'gi'),
  new RegExp(`${CYR_START}(бля|блять|блядь|блядина|блядство|поблядушка)${CYR_END}`, 'gi'),

  // Обсценные и вульгарные слова
  new RegExp(`${CYR_START}(мудак|мудила|мудило|залупа|гондон|гандон|шлюха|шалава|проститутка|потаскуха)${CYR_END}`, 'gi'),
  new RegExp(`${CYR_START}(членосос|пидорас|пидор|педик|пидрила|сука|сучка|сучара|сучий|суки|тварь|мразь)${CYR_END}`, 'gi'),
  new RegExp(`${CYR_START}(дрочить|дрочер|дрочила|отсоси|соси|трахать|трахнул|трахни|вздрочни)${CYR_END}`, 'gi'),
  new RegExp(`${CYR_START}(говно|говнище|дерьмо|засранец|обосрался|срака|жопа|пердеть|дрищ)${CYR_END}`, 'gi'),

  // 18+ / порнография на русском
  new RegExp(`${CYR_START}(порно|порнуха|порнография|порнофильм|порноактриса|хентай|камшот|минет|кунилингус|инцест|педофил)${CYR_END}`, 'gi'),
  new RegExp(`${CYR_START}(секс|секас|траходром|интим|секс-шоп|секс-услуги|проституция)${CYR_END}`, 'gi'),

  // Скамы и нелегальные темы
  new RegExp(`${CYR_START}(казино|вулкан|ставки|1xbet|пин-ап|крипто-памп|раздача крипты|легкий заработок|купить диплом|пробив|взлом|наркотики|соли|меф|закладки|hydra|мефедрон)${CYR_END}`, 'gi'),
];

// ============================================================================
// 4. ЕВРОПЕЙСКИЕ ЯЗЫКИ (Испанский, Французский, Немецкий, Итальянский)
// ============================================================================

export const EUROPEAN_PATTERNS: RegExp[] = [
  // Spanish / Portuguese
  /\b(puta|puto|mierda|coño|follar|chingar|cabron|pendejo|maricon|porno|fodasse|caralho)\b/i,
  // French
  /\b(merde|putain|salope|encule|connard|baiser|bite|chienne)\b/i,
  // German
  /\b(scheisse|fotze|ficken|arschloch|hurensohn|schlampe|wichser)\b/i,
  // Italian
  /\b(cazzo|merda|stronzo|puttana|troia|frocio|vaffanculo)\b/i,
];

// ============================================================================
// 5. УНИВЕРСАЛЬНЫЕ НОРМАЛИЗАТОРЫ (ВЬЕТНАМСКИЙ, LEETSPEAK, ДУБЛИ, ТРАНСЛИТ)
// ============================================================================

/**
 * Удаляет вьетнамские тоновые диакритические знаки (đ -> d, é -> e, etc.)
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase();
}

/**
 * Нормализует строку: удаляет маскирующие символы, спецсимволы,
 * схлопывает повторяющиеся буквы (например "poooorno" -> "porno", "пппиииздец" -> "пиздец").
 */
export function normalizeGlobalText(text: string): {
  normalized: string;
  condensed: string;
  noSeparators: string;
  unaccented: string;
} {
  if (!text) return { normalized: '', condensed: '', noSeparators: '', unaccented: '' };

  let raw = text.toLowerCase();

  // Удаляем zero-width символы и невидимые юникод-разделители
  raw = raw.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '');

  // 1. Нормализация без диакритики (для вьетнамского, европейских языков)
  const unaccented = removeVietnameseTones(raw);

  // 2. Нормализация Leetspeak для Латиницы и Кириллицы
  let normalized = raw
    .replace(/[0oо]/g, 'o')
    .replace(/[1!i|l]/g, 'i')
    .replace(/[3eе]/g, 'e')
    .replace(/[4aа@]/g, 'a')
    .replace(/[5s$]/g, 's')
    .replace(/[7tт]/g, 't')
    .replace(/[uуv]/g, 'u')
    .replace(/[xх]/g, 'x')
    .replace(/[kк]/g, 'k')
    .replace(/[mм]/g, 'm')
    .replace(/[cс]/g, 'c')
    .replace(/[pр]/g, 'p');

  // 3. Схлопывание 3+ одинаковых символов подряд ("poooorno" -> "porno")
  const condensed = normalized.replace(/(.)\1{2,}/gu, '$1$1');

  // 4. Вариант без знаков препинания и разделителей ("p.o.r.n" -> "porn", "х-у-й" -> "хуй")
  const noSeparators = condensed.replace(/[\*\.\,\-\_\~\|\/\\\#\+\=\s\:\;\"\'\(\)\[\]\{\}]/g, '');

  return {
    normalized,
    condensed,
    noSeparators,
    unaccented,
  };
}
