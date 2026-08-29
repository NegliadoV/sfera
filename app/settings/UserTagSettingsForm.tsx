'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/components/i18n/LanguageProvider';

export function UserTagSettingsForm() {
  const { t } = useTranslation();
  const [userTag, setUserTag] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let c = false;
    fetch('/api/me/user-tag', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (!c) {
          const tag = data?.userTag ?? '';
          setUserTag(tag);
          setInputValue(tag ? `@${tag}` : '');
        }
      })
      .finally(() => { if (!c) setLoading(false); });
    return () => { c = true; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    setSaved(false);
    try {
      const raw = inputValue.trim().replace(/^@+/, '');
      const res = await fetch('/api/me/user-tag', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userTag: raw || null }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserTag(data.userTag ?? '');
        setInputValue(data.userTag ? `@${data.userTag}` : '');
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(data.error ?? t('common.error', 'Ошибка сохранения'));
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('common.loading', 'Загрузка…')}</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="user-tag-input" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          {t('settings.userTag', 'Личный тег')}
        </label>
        <input
          id="user-tag-input"
          type="text"
          placeholder="@bublik33"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="settings-input w-full max-w-[280px]"
          style={{ fontFamily: 'monospace' }}
        />
        <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
          {t('settings.userTagDesc', 'Ваш уникальный тег для поиска в контактах (@username).')}
        </p>
      </div>
      {error && <p className="text-sm" style={{ color: 'var(--accent-red, #e53e3e)' }}>{error}</p>}
      <button type="submit" disabled={saving} className="platform-btn platform-btn-sm">
        {saving ? t('common.saving', 'Сохранение…') : t('common.save', 'Сохранить')}
      </button>
      {saved && <span className="text-sm ml-2" style={{ color: 'var(--accent-green)' }}>{t('common.saved', 'Сохранено')}</span>}
    </form>
  );
}
