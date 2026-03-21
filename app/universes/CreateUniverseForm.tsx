'use client';

import { useState } from 'react';
import Link from 'next/link';

export function CreateUniverseForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [conflictSlug, setConflictSlug] = useState<string | null>(null);

  // Популярные иконки Font Awesome
  const popularIcons = [
    'fa-globe',
    'fa-star',
    'fa-rocket',
    'fa-brain',
    'fa-book',
    'fa-code',
    'fa-paintbrush',
    'fa-music',
    'fa-camera',
    'fa-film',
    'fa-gamepad',
    'fa-dumbbell',
    'fa-heart',
    'fa-lightbulb',
    'fa-atom',
    'fa-flask',
    'fa-microscope',
    'fa-chart-line',
    'fa-graduation-cap',
    'fa-briefcase',
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setPending(true);
    setError('');
    setConflictSlug(null);
    try {
      const s = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      // Нормализуем иконку перед отправкой
      const normalizedIcon = icon.trim() ? (icon.trim().startsWith('fa-') ? icon.trim() : `fa-${icon.trim()}`) : undefined;
      
      const res = await fetch('/api/universes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          slug: s,
          name: name.trim(),
          description: description.trim() || undefined,
          icon: normalizedIcon || undefined,
          isPrivate,
          monthlyPrice: isPrivate && monthlyPrice.trim() ? parseInt(monthlyPrice, 10) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          setError('Сессия истекла или вы не авторизованы. Войдите снова.');
        } else if (res.status === 409) {
          setError('Сфера с таким адресом (slug) уже существует. Перейдите к ней или измените slug.');
          setConflictSlug(typeof data?.slug === 'string' ? data.slug.trim() : s || null);
        } else {
          setError(data?.error ?? 'Ошибка создания');
        }
        setPending(false);
        return;
      }
      const targetSlug = typeof data?.slug === 'string' && data.slug.trim() ? data.slug.trim() : s;
      if (!targetSlug) {
        setError('Не удалось определить адрес сферы.');
        setPending(false);
        return;
      }
      window.location.href = `/universes/${encodeURIComponent(targetSlug)}`;
      return;
    } catch {
      setError('Ошибка создания');
    }
    setPending(false);
  };

  return (
    <form onSubmit={submit}>
      <div className="universes-create-header">
        <i className="fa-solid fa-compass" aria-hidden />
        <h2>Создать сферу</h2>
      </div>

      <div className="universes-form-grid">
        <div className="universes-field-full">
          <div className="universes-field-label">
            <i className="fa-solid fa-heading" aria-hidden /> НАЗВАНИЕ{' '}
            <span className="universes-field-hint">Например: Квантовая физика</span>
          </div>
          <div className="universes-input-wrapper">
            <input
              type="text"
              id="universe-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Квантовая физика"
              required
            />
          </div>
        </div>

        <div className="universes-field-full">
          <div className="universes-field-label">
            <i className="fa-solid fa-file-lines" aria-hidden /> ОПИСАНИЕ{' '}
            <span className="universes-field-hint">НЕОБЯЗАТЕЛЬНО</span>
          </div>
          <div className="universes-input-wrapper">
            <textarea
              id="universe-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание сферы"
              rows={2}
            />
          </div>
        </div>

        <div className="universes-field-full">
          <div className="universes-field-label">
            <i className="fa-solid fa-image" aria-hidden /> ИКОНКА{' '}
            <span className="universes-field-hint">НЕОБЯЗАТЕЛЬНО</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="universes-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className={`fa-solid ${icon.trim() || 'fa-globe'}`} style={{ fontSize: '1.2rem', color: 'var(--accent-primary-muted)' }} aria-hidden />
              <input
                type="text"
                id="universe-icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="fa-globe (Font Awesome класс)"
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              {popularIcons.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={icon === iconName ? 'platform-btn platform-btn-primary' : 'platform-btn'}
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.85rem',
                    minWidth: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <i className={`fa-solid ${iconName}`} aria-hidden />
                  {iconName.replace('fa-', '')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="universes-field-full">
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Сделать сферу закрытой (по подписке)</span>
          </label>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4, marginLeft: 28 }}>
            Доступ к сфере будет только у подписчиков после оплаты через ЮKassa.
          </div>
          
          {isPrivate && (
            <div style={{ marginTop: 12, marginLeft: 28 }}>
              <div className="universes-field-label" style={{ marginBottom: 6 }}>
                <i className="fa-solid fa-ruble-sign" aria-hidden /> СТОИМОСТЬ В МЕСЯЦ (RUB)
              </div>
              <div className="universes-input-wrapper">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  placeholder="Например: 500"
                  required={isPrivate}
                />
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="universes-create-btn"
        >
          <i className={`fa-regular ${pending ? 'fa-spinner fa-spin' : 'fa-star'}`} aria-hidden />
          {pending ? 'Создание...' : 'Создать сферу'}
          <i className="fa-solid fa-plus" aria-hidden />
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 16, fontSize: '0.9rem', color: '#f23f42' }}>
          <p>{error}</p>
          {error.includes('авторизованы') && (
            <Link
              href={`/auth/signin?callbackUrl=${encodeURIComponent('/')}`}
              style={{ display: 'inline-block', marginTop: 8, textDecoration: 'underline', color: '#79a6ff' }}
            >
              Перейти на страницу входа
            </Link>
          )}
          {conflictSlug && (
            <Link
              href={`/universes/${encodeURIComponent(conflictSlug)}`}
              style={{ display: 'inline-block', marginTop: 8, textDecoration: 'underline', color: '#79a6ff' }}
            >
              Перейти к существующей сфере
            </Link>
          )}
        </div>
      )}
    </form>
  );
}
