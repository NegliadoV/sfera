'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SferaSphereIcon } from '@/components/SferaSphereIcon';
import { formatUpdated } from '@/lib/utils/date';

export interface CabinetTrackedUniverseItemProps {
  slug: string;
  name: string;
  description: string | null;
  sphereColor?: string | null;
  updatedAt: Date;
  unreadCount?: number;
}

export function CabinetTrackedUniverseItem({
  slug,
  name,
  description,
  sphereColor,
  updatedAt,
  unreadCount = 0,
}: CabinetTrackedUniverseItemProps) {
  const router = useRouter();
  const [unsubscribing, setUnsubscribing] = useState(false);
  const href = `/universes/${encodeURIComponent(slug)}`;
  const formattedDate = formatUpdated(updatedAt);

  const handleUnsubscribe = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (unsubscribing) return;
    setUnsubscribing(true);
    try {
      const res = await fetch(`/api/universes/${encodeURIComponent(slug)}/track`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data?.error ?? 'Не удалось отписаться');
      }
    } catch {
      alert('Ошибка сети');
    } finally {
      setUnsubscribing(false);
    }
  };

  return (
    <div
      className="cabinet-universe-item"
      style={{ position: 'relative', paddingRight: '100px' }}
    >
      <Link
        href={href}
        style={{ display: 'flex', alignItems: 'center', flex: 1, textDecoration: 'none', color: 'inherit', gap: '18px' }}
      >
        <div className="cabinet-universe-icon cabinet-universe-icon--sphere">
          <SferaSphereIcon size="sm" color={sphereColor} />
        </div>
        <div className="cabinet-universe-info">
          <div className="cabinet-universe-name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {name}
            {unreadCount > 0 && (
              <span
                className="cabinet-tracked-badge"
                style={{
                  background: 'var(--accent-primary)',
                  color: 'white',
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontWeight: 600,
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <div className="cabinet-universe-desc">
            {description ? `${description.slice(0, 40)}${description.length > 40 ? '…' : ''}` : 'Сфера'}
            {' · '}
            обновлено {formattedDate}
          </div>
        </div>
      </Link>
      <button
        type="button"
        onClick={handleUnsubscribe}
        disabled={unsubscribing}
        className="cabinet-unsubscribe-btn"
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          padding: '6px 14px',
          fontSize: '0.8rem',
          borderRadius: 20,
          border: '1px solid rgba(100, 150, 200, 0.4)',
          background: 'rgba(50, 80, 120, 0.3)',
          color: 'var(--text-secondary)',
          cursor: unsubscribing ? 'wait' : 'pointer',
          transition: 'background 0.2s, border-color 0.2s',
        }}
        title="Отписаться от уведомлений"
      >
        {unsubscribing ? '…' : 'Отписаться'}
      </button>
    </div>
  );
}
