'use client';

import { useTheme } from '@/components/ThemeProvider';

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

  const mainBlockPercent = Math.round(backgroundOpacity * 100);

  return (
    <>
      {/* Карточка: Внешний вид */}
      <div className="settings-card">
        <div className="settings-card-title">
          <i className="fa-solid fa-palette" aria-hidden />
          <h2>Внешний вид</h2>
        </div>
        <div className="settings-card-desc">
          Тема, цвет интерфейса, прозрачность и акцент.
        </div>

        <div className="settings-color-label">
          <i className="fa-solid fa-fill-drip" aria-hidden /> ЦВЕТ ИНТЕРФЕЙСА
        </div>
        <div className="settings-color-hint">
          Оттенок фона и границ по всему приложению (сайдбар, карточки, шапка).
        </div>
        <div className="settings-color-grid">
          {interfaceTintPresets.map((preset) => {
            const isActive = interfaceTint === preset.hue;
            return (
              <button
                key={preset.hue}
                type="button"
                onClick={() => setInterfaceTint(preset.hue)}
                title={preset.label}
                className={`settings-color-option ${isActive ? 'active' : ''}`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 24 }}>
          <div className="settings-color-label" style={{ marginTop: 0 }}>
            Акцентный цвет
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
          <i className="fa-regular fa-clock" aria-hidden /> цвет применяется сразу
        </div>
      </div>

      {/* Карточка: Фон и стекло */}
      <div className="settings-card">
        <div className="settings-card-title">
          <i className="fa-regular fa-glass" aria-hidden />
          <h2>Фон и стекло</h2>
        </div>
        <div className="settings-card-desc">
          Прозрачность основного блока. «Стекло» даёт эффект размытия фона.
        </div>

        <div className="settings-glass-presets">
          {backgroundOpacityPresets.map((preset) => {
            const isActive = Math.abs(backgroundOpacity - preset.value) < 0.01;
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => setBackgroundOpacity(preset.value)}
                className={`settings-glass-btn ${isActive ? 'active' : ''}`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="settings-transparency-section">
          <div className="settings-transparency-label">
            <span><i className="fa-regular fa-square" aria-hidden /> Основной блок</span>
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

        <div style={{ marginTop: 24 }}>
          <div className="settings-color-label" style={{ marginTop: 0 }}>
            Сила размытия
          </div>
          <div className="settings-glass-presets" style={{ marginTop: 12 }}>
            {backgroundBlurPresets.map((preset) => {
              const isActive = backgroundBlur === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setBackgroundBlur(preset.value)}
                  className={`settings-glass-btn ${isActive ? 'active' : ''}`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

          <div className="settings-blur-note">
            <i className="fa-regular fa-blur" aria-hidden />
            <span>{backgroundBlur === 0 ? 'размытие отключено' : `размытие ${backgroundBlur}px (backdrop-filter)`}</span>
          </div>
        </div>
      </div>
    </>
  );
}
