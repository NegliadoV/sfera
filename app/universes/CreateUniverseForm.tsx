'use client';

import { useState } from 'react';
import Link from 'next/link';
import { generateSlug } from '@/lib/utils/slug';
import { useTranslation } from '@/components/i18n/LanguageProvider';

export function CreateUniverseForm() {
  const { t } = useTranslation();
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
      const s = generateSlug(name.trim());
      // Нормализуем иконку (URL картинки или FontAwesome класс)
      const rawIcon = icon.trim();
      const normalizedIcon = rawIcon
        ? (rawIcon.startsWith('http') || rawIcon.startsWith('/') || rawIcon.endsWith('.svg') || rawIcon.endsWith('.png') || rawIcon.endsWith('.jpg')
            ? rawIcon
            : rawIcon.startsWith('fa-') ? rawIcon : `fa-${rawIcon}`)
        : undefined;
      
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
          setError(t('rooms.sessionExpired', 'Сессия истекла или вы не авторизованы. Войдите снова.'));
        } else if (res.status === 409) {
          setError(t('rooms.roomAlreadyExists', 'Комната с таким адресом (slug) уже существует. Перейдите к ней или измените slug.'));
          setConflictSlug(typeof data?.slug === 'string' ? data.slug.trim() : s || null);
        } else {
          setError(data?.botMessage || data?.error || t('rooms.createError', 'Ошибка создания'));
        }
        setPending(false);
        return;
      }

      const targetSlug = typeof data?.slug === 'string' && data.slug.trim() ? data.slug.trim() : s;
      if (!targetSlug) {
        setError(t('rooms.cantDetermineSlug', 'Не удалось определить адрес комнаты.'));
        setPending(false);
        return;
      }
      window.location.href = `/universes/${encodeURIComponent(targetSlug)}`;
      return;
    } catch {
      setError(t('rooms.createError', 'Ошибка создания'));
    }
    setPending(false);
  };

  return (
    <form onSubmit={submit}>
      <div className="universes-create-header">
        <i className="fa-solid fa-shapes" aria-hidden />
        <h2>{t('rooms.createTitle', 'Создать комнату')}</h2>
      </div>

      <div className="universes-form-grid">
        <div className="universes-field-full">
          <div className="universes-field-label">
            <i className="fa-solid fa-heading" aria-hidden /> {t('rooms.roomName', 'НАЗВАНИЕ').toUpperCase()}{' '}
            <span className="universes-field-hint">{t('rooms.roomNamePlaceholder', 'Например: Квантовая физика')}</span>
          </div>
          <div className="universes-input-wrapper">
            <input
              type="text"
              id="universe-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('rooms.roomNamePlaceholder', 'Например: Квантовая физика')}
              required
            />
          </div>
        </div>

        <div className="universes-field-full">
          <div className="universes-field-label">
            <i className="fa-solid fa-file-lines" aria-hidden /> {t('rooms.description', 'ОПИСАНИЕ').toUpperCase()}{' '}
            <span className="universes-field-hint">{t('common.optional', 'ОПЦИОНАЛЬНО').toUpperCase()}</span>
          </div>
          <div className="universes-input-wrapper">
            <textarea
              id="universe-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('rooms.descriptionPlaceholder', 'Краткое описание комнаты')}
              rows={2}
            />
          </div>
        </div>

        <div className="universes-field-full">
          <div className="universes-field-label">
            <i className="fa-solid fa-image" aria-hidden /> {t('rooms.avatarOrIcon', 'АВАТАР ИЛИ ИКОНКА')}{' '}
            <span className="universes-field-hint">{t('rooms.avatarOrIconHint', 'ССЫЛКА НА ФОТО ИЛИ ИКОНКА')}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="universes-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className={`fa-solid ${icon.trim() && !icon.startsWith('http') ? (icon.startsWith('fa-') ? icon : `fa-${icon}`) : 'fa-image'}`} style={{ fontSize: '1.2rem', color: 'var(--accent-primary-muted)' }} aria-hidden />
              <input
                type="text"
                id="universe-icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder={t('rooms.avatarPlaceholder', 'https://example.com/avatar.jpg или fa-atom')}
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
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('rooms.makePrivate', 'Сделать комнату закрытой (по подписке)')}</span>
          </label>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4, marginLeft: 28 }}>
            {t('rooms.makePrivateDesc', 'Доступ к комнате будет только у подписчиков после оплаты через ЮKassa.')}
          </div>
          
          {isPrivate && (
            <div style={{ marginTop: 12, marginLeft: 28 }}>
              <div className="universes-field-label" style={{ marginBottom: 6 }}>
                <i className="fa-solid fa-ruble-sign" aria-hidden /> {t('rooms.monthlyPriceLabel', 'СТОИМОСТЬ В МЕСЯЦ (RUB)')}
              </div>
              <div className="universes-input-wrapper">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  placeholder={t('rooms.pricePlaceholder', 'Например: 500')}
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
          {pending ? t('common.creating', 'Создание...') : t('rooms.createTitle', 'Создать комнату')}
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
              {t('rooms.goToLogin', 'Перейти на страницу входа')}
            </Link>
          )}
          {conflictSlug && (
            <Link
              href={`/universes/${encodeURIComponent(conflictSlug)}`}
              style={{ display: 'inline-block', marginTop: 8, textDecoration: 'underline', color: '#79a6ff' }}
            >
              {t('rooms.goToExistingRoom', 'Перейти к существующей комнате')}
            </Link>
          )}
        </div>
      )}
    </form>
  );
}
