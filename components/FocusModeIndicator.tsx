'use client';

import { useHygiene } from '@/components/HygieneProvider';
import { SessionTimer } from '@/components/SessionTimer';

/**
 * Зелёный pill по плану: «Режим фокуса активен (таймер: …)».
 * Показывается только когда у пользователя включён режим фокуса.
 */
export function FocusModeIndicator() {
  const { hygiene } = useHygiene();
  if (!hygiene.focusMode) return null;

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-6"
      style={{
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        color: 'var(--accent-green)',
      }}
    >
      <span className="animate-pulse" aria-hidden>🕐</span>
      <span>Режим фокуса активен</span>
      {hygiene.dailyTimeLimitMinutes != null && hygiene.dailyTimeLimitMinutes > 0 && (
        <>
          <span> (таймер: </span>
          <SessionTimer />
          <span>)</span>
        </>
      )}
    </div>
  );
}
