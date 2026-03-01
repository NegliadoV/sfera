/** Aligned with web app (app/globals.css) — accent and dark/light theme */
const accent = '#2563eb';
const darkBg = '#1a1b1d';
const lightBg = '#f2f3f5';

export default {
  light: {
    text: '#1e1f22',
    background: lightBg,
    tint: accent,
    tabIconDefault: '#6d7078',
    tabIconSelected: accent,
  },
  dark: {
    text: '#e4e6e9',
    background: darkBg,
    tint: accent,
    tabIconDefault: '#7a7d84',
    tabIconSelected: accent,
  },
};
