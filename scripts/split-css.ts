/**
 * split-css.ts — Скрипт разбивки globals.css на тематические модули.
 *
 * Запуск: tsx scripts/split-css.ts
 *
 * Создаёт:
 *   app/styles/variables.css    — CSS-переменные (:root, темы, [data-theme=...])
 *   app/styles/animations.css   — @keyframes и blob-анимации
 *   app/styles/base.css         — html, body, scrollbar, selection, reset
 *   app/styles/layout.css       — .app-container, .app-shell, .platform-page, sidebar layout
 *   app/styles/components.css   — переиспользуемые компонентные классы
 *
 * После запуска globals.css заменяется на файл с @import-директивами.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const GLOBALS_PATH = path.join(ROOT, 'app', 'globals.css');
const STYLES_DIR = path.join(ROOT, 'app', 'styles');

const content = fs.readFileSync(GLOBALS_PATH, 'utf8');
const lines = content.split('\n');

// Создаём папку styles
fs.mkdirSync(STYLES_DIR, { recursive: true });

// ─── Стратегия разбивки по номерам строк ─────────────────────────────────────
// Определяем диапазоны вручную, после изучения структуры файла.
// Строки 1-1: @import tailwindcss  → остаётся в globals.css
// Строки 3-238: CSS-переменные (variables.css)
// Строки 239-281: Анимации blob (animations.css)
// Строки 282-315: base (html, body, @theme) (base.css)
// Строки 316-480: layout (glass container, app-shell, platform-page) (layout.css)
// Строки 481+: компоненты (components.css)

function extractLines(from: number, to: number): string {
  // from/to — 1-indexed, inclusive
  return lines.slice(from - 1, to).join('\n');
}

// 1. variables.css (строки 3–238)
const variablesContent = `/* Design system — SFERA. Темная/светлая тема + кастомный акцент */\n\n` + extractLines(3, 238);
fs.writeFileSync(path.join(STYLES_DIR, 'variables.css'), variablesContent, 'utf8');
console.log('✅ app/styles/variables.css');

// 2. animations.css (строки 239–281)
const animationsContent = `/* Background Blobs и прочие @keyframes анимации */\n\n` + extractLines(239, 281);
fs.writeFileSync(path.join(STYLES_DIR, 'animations.css'), animationsContent, 'utf8');
console.log('✅ app/styles/animations.css');

// 3. base.css (строки 282–315)
const baseContent = `/* Base: html, body, @theme inline, scrollbar */\n\n` + extractLines(282, 343);
fs.writeFileSync(path.join(STYLES_DIR, 'base.css'), baseContent, 'utf8');
console.log('✅ app/styles/base.css');

// 4. layout.css (строки 344–480)
const layoutContent = `/* Layout: glassmorphism container, app-shell, platform-page */\n\n` + extractLines(344, 480);
fs.writeFileSync(path.join(STYLES_DIR, 'layout.css'), layoutContent, 'utf8');
console.log('✅ app/styles/layout.css');

// 5. components.css (строки 481 до конца)
const componentsContent = `/* Components: переиспользуемые классы платформы */\n\n` + extractLines(481, lines.length);
fs.writeFileSync(path.join(STYLES_DIR, 'components.css'), componentsContent, 'utf8');
console.log('✅ app/styles/components.css');

// 6. Новый globals.css — только импорты
const newGlobals = `@import "tailwindcss";

/* ─── Design System Modules ─────────────────────────────────────────────────
 * Файл разбит на модули для удобства поддержки.
 * Редактируйте нужный файл в app/styles/ вместо этого файла напрямую.
 * ─────────────────────────────────────────────────────────────────────── */
@import "./styles/variables.css";   /* CSS-переменные: цвета, токены, темы */
@import "./styles/animations.css";  /* @keyframes: blob-анимации           */
@import "./styles/base.css";        /* Base: html, body, scrollbar          */
@import "./styles/layout.css";      /* Layout: app-shell, glassmorphism     */
@import "./styles/components.css";  /* Components: platform-*, sidebar-*    */
`;

fs.writeFileSync(GLOBALS_PATH, newGlobals, 'utf8');
console.log('✅ app/globals.css обновлён (только импорты)');

console.log('\n📦 Разбивка завершена! Итого:');
const files = [
  'variables.css',
  'animations.css',
  'base.css',
  'layout.css',
  'components.css',
].map((f) => {
  const filePath = path.join(STYLES_DIR, f);
  const bytes = fs.statSync(filePath).size;
  return `   ${f.padEnd(20)} ${(bytes / 1024).toFixed(1)} KB`;
});
files.forEach(f => console.log(f));
