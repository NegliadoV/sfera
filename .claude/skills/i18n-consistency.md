---
name: i18n-consistency
description: Check translation files for missing keys, typos, consistency, and formatting issues across all supported locales
trigger: manual
---

# i18n Consistency Check

## Purpose
Ensure all translations are complete, consistent, and correctly formatted across all supported languages. Catch missing keys, typos, placeholder mismatches, and cultural issues before users encounter broken UI.

## When to invoke
- Before deploying new features with user-facing text
- After adding new translation keys
- User reports: "text shows key instead of translation", "broken on Spanish version"
- User asks: "check translations", "verify i18n", "missing language strings"

## Process

### 1. Discover Translation Structure

**Find translation files:**
```bash
find ./lib/i18n -name "*.ts" -o -name "*.json"
```

Common patterns:
- `lib/i18n/dictionaries/en.ts`, `ru.ts`, `es.ts`, etc.
- `locales/en.json`, `locales/ru.json`
- `messages/en.js`

**Identify:**
- Reference language (usually `en` — English)
- Supported locales (from `SUPPORTED_LOCALES` constant or config)
- Key structure (nested objects vs flat keys)

### 2. Check Missing Keys

**For each non-reference language:**

Compare against reference (`en.ts`):
- Keys present in `en.ts` but missing in `ru.ts` → user sees fallback or broken UI
- Keys present in `ru.ts` but not in `en.ts` → dead code (warn, not error)

**Example:**
```typescript
// en.ts
export const dict = {
  landing: {
    heroTitle: "Welcome to Roominate",
    cta: "Get Started"
  }
}

// ru.ts (MISSING 'cta' key)
export const dict = {
  landing: {
    heroTitle: "Добро пожаловать в Roominate"
    // ❌ Missing: cta
  }
}
```

**Output:**
```
❌ ru.ts: Missing key 'landing.cta'
❌ es.ts: Missing key 'landing.cta'
✅ de.ts: All keys present
```

### 3. Check Placeholder Consistency

**Variables in translation strings:**

If reference has `{name}`, all translations must have same placeholder:

```typescript
// en.ts
welcome: "Welcome, {name}!"

// ru.ts (WRONG placeholder)
welcome: "Добро пожаловать, {username}!" // ❌ Should be {name}

// es.ts (CORRECT)
welcome: "¡Bienvenido, {name}!" // ✅
```

**Check for:**
- Placeholder name mismatch: `{count}` vs `{total}`
- Missing placeholder: `{count} posts` → `публикации` (no count)
- Extra placeholder: adds `{date}` not in reference

### 4. Check Formatting

**Common issues:**

- **HTML entities**: `&nbsp;` in one language, regular space in another
- **Quotes**: `"text"` vs `«text»` vs `„text"` — should match locale conventions
- **Punctuation**: `Hello, world!` vs `Hello, world !` (extra space before `!` in French)
- **Capitalization**: `Sign In` vs `Sign in` vs `SIGN IN` — should be consistent
- **Trailing spaces**: Easy to miss, causes UI misalignment

**Tool to suggest:**
```bash
# Check for trailing spaces
grep -E ":\s*['\"].*\s+['\"]" lib/i18n/dictionaries/*.ts
```

### 5. Check Length & UI Fit

**Text expansion:**

Some languages are 30-50% longer than English:
- English: "Sign in" (7 chars)
- German: "Anmelden" (8 chars) ✅
- Russian: "Войти" (5 chars) ✅
- Spanish: "Iniciar sesión" (14 chars) ⚠️ Might overflow button

**Flag:**
- Translations >2x length of English (might break UI)
- Suggest: Use shorter synonym or adjust button width

### 6. Check Cultural Appropriateness

**Potential issues:**

- **Colors**: Red = danger in West, luck in China
- **Icons**: Thumbs up offensive in some cultures
- **Dates**: MM/DD/YYYY (US) vs DD/MM/YYYY (EU) vs YYYY-MM-DD (ISO)
- **Numbers**: `1,000.50` (US) vs `1.000,50` (EU)
- **Gender**: Languages with gendered nouns (Spanish, Russian) need variants

**Example:**
```typescript
// en.ts
newPost: "{count} new post"

// ru.ts (WRONG — doesn't handle Russian plurals)
newPost: "{count} новый пост" // Should be: 1 пост, 2 поста, 5 постов

// CORRECT (with plural rules)
newPost_one: "{count} новый пост"
newPost_few: "{count} новых поста"
newPost_many: "{count} новых постов"
```

### 7. Check Dead Keys

**Find unused translations:**

- Keys defined in dictionaries but never referenced in code
- Causes: refactored components, deleted features, typos in key names

**How to check:**
```bash
# Get all keys from en.ts
# Search codebase for usage
grep -r "dict.landing.oldFeature" app/ components/
```

If no results → dead key (can remove).

### 8. Check Key Naming Consistency

**Good patterns:**
- `landing.heroTitle` — namespaced by page/feature
- `common.save`, `common.cancel` — shared strings
- `errors.notFound`, `errors.forbidden` — grouped by category

**Bad patterns:**
- `title1`, `title2`, `title3` — unclear context
- `mainHeroTitleForLandingPageAbove` — too verbose
- Mix of camelCase and snake_case

### 9. Check Type Safety (TypeScript projects)

**If using TypeScript:**

- Does translation function have type hints?
- Are keys type-checked? (e.g., `dict.landing.typo` → TS error)

**Example type-safe pattern:**
```typescript
// types.ts
export type Dictionary = typeof import('./dictionaries/en').dict;

// getDictionary.ts
export function getDictionary(locale: Locale): Dictionary {
  return require(`./dictionaries/${locale}`).dict;
}

// Usage (type-checked)
const dict = getDictionary('ru');
dict.landing.heroTitle // ✅ Autocomplete works
dict.landing.typo // ❌ TS error
```

### 10. Output Format

```markdown
## i18n Consistency Report

### ✅ Supported Locales (9)
en, ru, es, de, fr, pt, zh, ar, hi

### ❌ Missing Keys (12 total)

**ru.ts (3 missing):**
- `landing.featureMindMapsTitle`
- `landing.featureMindMapsDesc`
- `settings.privacy.title`

**es.ts (5 missing):**
- `landing.featureMindMapsTitle`
- `landing.featureMindMapsDesc`
- `settings.privacy.title`
- `settings.privacy.desc`
- `errors.rateLimited`

**de.ts (4 missing):**
- [same as es.ts, minus 1]

### ⚠️ Placeholder Mismatches (2)

**ru.ts:**
- `feed.newPosts`: Has `{total}` but reference uses `{count}`

**es.ts:**
- `profile.followers`: Missing `{count}` placeholder

### 🔤 Formatting Issues (3)

**fr.ts:**
- `common.confirm`: Trailing space → `"Confirmer "`

**zh.ts:**
- `landing.heroTitle`: Uses full-width punctuation `！` (might be intentional)

**ar.ts:**
- `settings.theme`: LTR text in RTL language (check if intentional)

### 📏 Length Warnings (1)

**de.ts:**
- `auth.signInWithGoogle`: "Mit Google anmelden" is 18 chars (en: 14) — verify button width

### 🗑️ Dead Keys (5)

These keys are defined but never used in code:
- `landing.oldFeatureTitle` (in en, ru, es)
- `common.deprecated` (in all locales)
- `settings.betaFlag` (in en, ru)

### 💡 Recommendations

1. **Add missing keys** (12 keys × 3 languages = 36 additions)
   - Priority: `ru`, `es`, `de` (most users)
   - Use AI translation as first draft, then native review

2. **Fix placeholder mismatches**
   - `ru.ts`: Change `{total}` → `{count}` in `feed.newPosts`
   - `es.ts`: Add `{count}` to `profile.followers`

3. **Implement plural rules for Russian, Polish, Arabic**
   - These languages have complex plural forms
   - Use `Intl.PluralRules` or i18next's plural system

4. **Remove dead keys** (reduces bundle size by ~2KB)

5. **Add TypeScript types** for translation keys
   - Prevents typos at compile time
   - Enables autocomplete in IDE

6. **Consider i18n library**
   - Current: Manual dictionary objects
   - Upgrade to: `next-intl`, `react-i18next`, or `next-translate`
   - Benefits: Plural rules, date/number formatting, type safety

### 📝 Migration Script

[Provide script to add missing keys with placeholder "[TRANSLATE]"]

```typescript
// scripts/add-missing-i18n-keys.ts
const missing = {
  ru: ['landing.featureMindMapsTitle', ...],
  es: [...],
};

for (const [locale, keys] of Object.entries(missing)) {
  const dictPath = `./lib/i18n/dictionaries/${locale}.ts`;
  // Read, parse, add keys with "[TRANSLATE]" placeholder, write back
}
```
```

## Tools to suggest

```bash
# Find missing keys (requires Node.js script)
npx i18n-check ./lib/i18n/dictionaries --reference en

# Or manual diff
diff <(grep -r "export const" lib/i18n/dictionaries/en.ts) \
     <(grep -r "export const" lib/i18n/dictionaries/ru.ts)
```

## Scope

**Do check:**
- Key completeness across locales
- Placeholder consistency
- Dead/unused keys
- Formatting issues (spaces, quotes, capitalization)

**Don't check:**
- Translation quality (that needs native speakers)
- Grammar/spelling (use Grammarly or native review)
- Cultural nuance (needs cultural consultant)

**Can suggest (but not validate):**
- Better key naming
- Upgrading to proper i18n library
- Type safety improvements

## Example Invocation

User: "Check my translations for consistency"
Assistant:
1. Finds `lib/i18n/dictionaries/` with 9 locales
2. Compares all against `en.ts` (reference)
3. Reports: 12 missing keys, 2 placeholder mismatches, 5 dead keys
4. Provides migration script to add placeholders
5. Suggests i18n library upgrade for plural rules
