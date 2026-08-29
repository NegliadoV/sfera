'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/components/i18n/LanguageProvider';

interface TrackUniverseButtonProps {
  universeSlug: string;
  className?: string;
  /** Текст кнопки, напр. "Отслеживать канал" */
  label?: string;
  labelActive?: string;
}

export function TrackUniverseButton({ universeSlug, className = '', label, labelActive }: TrackUniverseButtonProps) {
  const { t } = useTranslation();
  const [tracking, setTracking] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);

  const displayLabel = label ?? t('rooms.follow', 'Отслеживать');
  const displayLabelActive = labelActive ?? t('rooms.following', 'Отслеживаю');

  useEffect(() => {
    if (!universeSlug) return;
    let cancelled = false;
    fetch(`/api/universes/${encodeURIComponent(universeSlug)}/track`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setTracking(data.tracking ?? false);
      })
      .catch(() => {
        if (!cancelled) setTracking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [universeSlug]);

  const handleClick = async () => {
    if (pending || tracking === null || !universeSlug) return;
    setPending(true);
    try {
      const res = await fetch(`/api/universes/${encodeURIComponent(universeSlug)}/track`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setTracking(data.tracking ?? !tracking);
      }
    } finally {
      setPending(false);
    }
  };

  if (tracking === null || !universeSlug) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`platform-btn platform-btn-sm ${className}`}
      title={tracking ? t('rooms.notifyNewPostsActive', 'Вы получите уведомление о новых постах') : t('rooms.notifyNewPosts', 'Уведомлять о новых постах')}
    >
      {tracking ? displayLabelActive : displayLabel}
    </button>
  );
}
