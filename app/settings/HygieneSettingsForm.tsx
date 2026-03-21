'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useHygiene } from '@/components/HygieneProvider';
import type { DigestDelivery } from '@/components/HygieneProvider';

export function HygieneSettingsForm() {
  const { hygiene, loading, setHygiene } = useHygiene();
  const [focusMode, setFocusMode] = useState(false);
  const [dailyTimeLimitMinutes, setDailyTimeLimitMinutes] = useState<string>('');
  const [digestDelivery, setDigestDelivery] = useState<DigestDelivery>('none');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFocusMode(hygiene.focusMode);
    setDailyTimeLimitMinutes(
      hygiene.dailyTimeLimitMinutes != null ? String(hygiene.dailyTimeLimitMinutes) : ''
    );
    setDigestDelivery(hygiene.digestDelivery);
  }, [hygiene]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await setHygiene({
        focusMode,
        dailyTimeLimitMinutes:
          dailyTimeLimitMinutes.trim() === '' ? null : Math.max(0, Math.min(24 * 60, Math.floor(Number(dailyTimeLimitMinutes)))),
        digestDelivery,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Загрузка настроек…
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="settings-checkbox-wrap">
          <input
            type="checkbox"
            checked={focusMode}
            onChange={(e) => setFocusMode(e.target.checked)}
            className="settings-checkbox"
          />
          <span className="settings-checkbox-visual" aria-hidden />
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
            Режим «Фокус»
          </span>
        </label>
        <p className="text-sm mt-1 ml-8" style={{ color: 'var(--text-secondary)' }}>
          Скрывать счётчики комментариев и отвлекающие элементы в ленте.
        </p>
      </div>

      <div>
        <label className="block font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Дневной лимит времени (минут)
        </label>
        <input
          type="number"
          min={0}
          max={24 * 60}
          placeholder="Без лимита"
          value={dailyTimeLimitMinutes}
          onChange={(e) => setDailyTimeLimitMinutes(e.target.value)}
          className="settings-input w-full max-w-[200px]"
        />
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Оставьте пустым, если лимит не нужен. Таймер показывается в интерфейсе (в разработке).
        </p>
      </div>

      <div>
        <span className="block font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Ежедневный дайджест
        </span>
        <div className="flex flex-wrap gap-4">
          {(['none', 'in_app', 'email'] as const).map((value) => (
            <label key={value} className="settings-radio-wrap">
              <input
                type="radio"
                name="digestDelivery"
                checked={digestDelivery === value}
                onChange={() => setDigestDelivery(value)}
                className="settings-radio"
              />
              <span className="settings-radio-visual" aria-hidden />
              <span style={{ color: 'var(--text-primary)' }}>
                {value === 'none' && 'Не присылать'}
                {value === 'in_app' && 'Только в приложении'}
                {value === 'email' && 'На email'}
              </span>
            </label>
          ))}
        </div>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Дайджест: анализ вашей активности, новые материалы во вселенных.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="platform-btn platform-btn-primary platform-btn-sm disabled:opacity-50"
        >
          {saving ? 'Сохранение…' : 'Сохранить'}
        </button>
        {saved && (
          <span className="text-sm settings-saved-text">
            Сохранено
          </span>
        )}
      </div>

      <p className="text-sm pt-4 border-t" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
        <Link href="/digest" className="underline" style={{ color: 'var(--text-accent)' }}>
          Перейти к разделу «Дайджест»
        </Link>
      </p>
    </form>
  );
}
