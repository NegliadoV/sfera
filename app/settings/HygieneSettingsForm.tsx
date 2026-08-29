'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useHygiene } from '@/components/HygieneProvider';
import type { DigestDelivery } from '@/components/HygieneProvider';
import { useTranslation } from '@/components/i18n/LanguageProvider';

export function HygieneSettingsForm() {
  const { hygiene, loading, setHygiene } = useHygiene();
  const { t } = useTranslation();
  const [focusMode, setFocusMode] = useState(false);
  const [smartFeedEnabled, setSmartFeedEnabled] = useState(true);
  const [dailyTimeLimitMinutes, setDailyTimeLimitMinutes] = useState<string>('');
  const [digestDelivery, setDigestDelivery] = useState<DigestDelivery>('none');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFocusMode(hygiene.focusMode);
    setSmartFeedEnabled(hygiene.smartFeedEnabled);
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
        smartFeedEnabled,
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
        {t('common.loading', 'Загрузка настроек…')}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Smart Recommendation Feed Toggle */}
      <div>
        <label className="settings-checkbox-wrap">
          <input
            type="checkbox"
            checked={smartFeedEnabled}
            onChange={(e) => setSmartFeedEnabled(e.target.checked)}
            className="settings-checkbox"
          />
          <span className="settings-checkbox-visual" aria-hidden />
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
            <i className="fa-solid fa-wand-magic-sparkles mr-1.5 text-[var(--accent-primary)]" aria-hidden />
            {t('hygiene.smartFeed', 'Умная рекомендательная лента')}
          </span>
        </label>
        <p className="text-sm mt-1 ml-8" style={{ color: 'var(--text-secondary)' }}>
          {t('hygiene.smartFeedDesc', 'Показывать больше материалов на основе просмотренного вами контента и интересов. При выключении лента отображается в хронологическом порядке.')}
        </p>
      </div>

      {/* Focus Mode */}
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
            {t('hygiene.focusMode', 'Режим «Фокус»')}
          </span>
        </label>
        <p className="text-sm mt-1 ml-8" style={{ color: 'var(--text-secondary)' }}>
          {t('hygiene.focusModeDesc', 'Скрывать счётчики комментариев и отвлекающие элементы в ленте.')}
        </p>
      </div>

      <div>
        <label className="block font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          {t('hygiene.dailyLimit', 'Дневной лимит времени (минут)')}
        </label>
        <input
          type="number"
          min={0}
          max={24 * 60}
          placeholder={t('hygiene.noLimit', 'Без лимита')}
          value={dailyTimeLimitMinutes}
          onChange={(e) => setDailyTimeLimitMinutes(e.target.value)}
          className="settings-input w-full max-w-[200px]"
        />
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {t('hygiene.dailyLimitDesc', 'Оставьте пустым, если лимит не нужен.')}
        </p>
      </div>

      <div>
        <span className="block font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          {t('hygiene.dailyDigest', 'Ежедневный дайджест')}
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
                {value === 'none' && t('hygiene.digestNone', 'Не присылать')}
                {value === 'in_app' && t('hygiene.digestInApp', 'Только в приложении')}
                {value === 'email' && t('hygiene.digestEmail', 'На email')}
              </span>
            </label>
          ))}
        </div>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {t('hygiene.digestDesc', 'Дайджест: анализ вашей активности, новые материалы во вселенных.')}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="platform-btn platform-btn-primary platform-btn-sm disabled:opacity-50"
        >
          {saving ? t('common.saving', 'Сохранение…') : t('common.save', 'Сохранить')}
        </button>
        {saved && (
          <span className="text-sm settings-saved-text">
            {t('common.saved', 'Сохранено')}
          </span>
        )}
      </div>

      <p className="text-sm pt-4 border-t" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
        <Link href="/digest" className="underline" style={{ color: 'var(--text-accent)' }}>
          {t('hygiene.goToDigest', 'Перейти к разделу «Дайджест»')}
        </Link>
      </p>
    </form>
  );
}
