'use client';

import { useDMSocket } from '@/hooks/useDMSocket';

/**
 * Глобальный слушатель новых DM — при получении сообщения обновляет бейджи
 * (иконка сообщений в хедере, счётчики у контактов в сайдбаре).
 */
export function DMBadgeListener({ enabled }: { enabled: boolean }) {
  useDMSocket(
    () => {
      window.dispatchEvent(new CustomEvent('messages-badge-refresh'));
    },
    enabled
  );
  return null;
}
