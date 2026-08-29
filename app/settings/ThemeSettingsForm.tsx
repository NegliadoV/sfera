'use client';

import { useTheme } from '@/components/ThemeProvider';
import { useTranslation } from '@/components/i18n/LanguageProvider';

export function ThemeSettingsForm() {
  const {
    accent,
    setAccent,
    accentPresets,
    backgroundOpacity,
    setBackgroundOpacity,
    backgroundOpacityPresets,
    backgroundBlur,
    setBackgroundBlur,
    backgroundBlurPresets,
    interfaceTint,
    setInterfaceTint,
    interfaceTintPresets,
  } = useTheme();
  const { t } = useTranslation();

  const mainBlockPercent = Math.round(backgroundOpacity * 100);

  return (
    <>
      {/* Карточка: Внешний вид */}
      <div className="settings-card">
        <div className="settings-card-title">
          <i className="fa-solid fa-palette" aria-hidden />
          <h2>{t('settings.appearance', 'Внешний вид')}</h2>
        </div>
        <div className="settings-card-desc">
          {t('settings.appearanceDesc', 'Тема, цвет интерфейса, прозрачность и акцент.')}
        </div>

        <div>
          <div className="settings-color-label" style={{ marginTop: 0 }}>
            {t('settings.accentColor', 'Акцентный цвет')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
            {accentPresets.map((preset) => {
              const isActive = accent.value.toLowerCase() === preset.value.toLowerCase();
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setAccent(preset.value, preset.hover)}
                  title={preset.name}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    border: isActive ? '3px solid white' : '2px solid rgba(255,255,255,0.2)',
                    background: preset.value,
                    cursor: 'pointer',
                    transition: 'transform 0.1s, border-color 0.15s',
                    boxShadow: isActive ? '0 0 12px #3f7bc0' : 'none',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                />
              );
            })}
          </div>
        </div>

        <div className="settings-note-muted">
          <i className="fa-regular fa-clock" aria-hidden /> {t('settings.colorApplied', 'цвет применяется сразу')}
        </div>
      </div>

      {/* Карточка: Фон и стекло */}
      <div className="settings-card">
        <div className="settings-card-title">
          <i className="fa-regular fa-glass" aria-hidden />
          <h2>{t('settings.glassPanel', 'Фон и стекло')}</h2>
        </div>
        <div className="settings-card-desc">
          {t('settings.glassPanelDesc', 'Прозрачность основного блока. «Стекло» даёт эффект размытия фона.')}
        </div>

        <div className="settings-glass-presets">
          {backgroundOpacityPresets.map((preset) => {
            const isActive = Math.abs(backgroundOpacity - preset.value) < 0.01;
            const glassLabelMap: Record<number, string> = {
              1: t('settings.glassSolid', 'Сплошной'),
              0.95: t('settings.glassNearSolid', 'Почти сплошной'),
              0.8: t('settings.glassGlass', 'Стекло'),
              0.6: t('settings.glassStrong', 'Сильное'),
              0.35: t('settings.glassUltra', 'Ультра-стекло'),
            };
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => setBackgroundOpacity(preset.value)}
                className={`settings-glass-btn ${isActive ? 'active' : ''}`}
              >
                {glassLabelMap[preset.value] ?? preset.label}
              </button>
            );
          })}
        </div>

        <div className="settings-transparency-section">
          <div className="settings-transparency-label">
            <span><i className="fa-regular fa-square" aria-hidden /> {t('settings.mainBlock', 'Основной блок')}</span>
            <span>{mainBlockPercent}%</span>
          </div>
          <input
            type="range"
            min={50}
            max={100}
            step={1}
            value={mainBlockPercent}
            onChange={(e) => setBackgroundOpacity(Number(e.target.value) / 100)}
            className="settings-opacity-slider"
            style={{ width: '100%', marginTop: 8 }}
            aria-label="Прозрачность основного блока"
          />

        </div>
      </div>
    </>
  );
}
