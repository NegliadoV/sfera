'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SferaSphereIcon } from '@/components/SferaSphereIcon';

type SubscriptionRow = {
  id: string;
  universe: { slug: string; name: string; sphereColor: string | null; monthlyPrice: number | null };
  status: string;
  currentPeriodEnd: string | null;
};

export function SubscriptionsList() {
  const [subs, setSubs] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me/subscriptions', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setSubs(Array.isArray(data) ? data : []))
      .catch(() => setSubs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Загрузка подписок...</div>;

  if (subs.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)' }}>
        У вас нет активных подписок на закрытые сферы.
      </div>
    );
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {subs.map((sub) => {
        const isActive = sub.status === 'active';
        const expired = sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) < new Date();
        const dateStr = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '—';

        return (
          <li key={sub.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 8, background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-accent)', flexShrink: 0, overflow: 'hidden' }}>
              <SferaSphereIcon size="md" color={sub.universe.sphereColor} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link href={`/universes/${encodeURIComponent(sub.universe.slug)}`} style={{ fontWeight: 600, display: 'block', textDecoration: 'none', color: 'var(--text-primary)', marginBottom: 4 }}>
                {sub.universe.name}
              </Link>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: '0.85rem' }}>
                <span style={{ color: isActive && !expired ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                  {isActive && !expired ? 'Активна' : 'Истекла / Отменена'}
                </span>
                <span style={{ color: 'var(--border-subtle)' }}>|</span>
                <span style={{ color: 'var(--text-secondary)' }}>Оплачено до: {dateStr}</span>
                {sub.universe.monthlyPrice && (
                  <>
                    <span style={{ color: 'var(--border-subtle)' }}>|</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{sub.universe.monthlyPrice} RUB / мес.</span>
                  </>
                )}
              </div>
            </div>
            {/* В будущем здесь можно добавить кнопку отмены подписки: <button>Отменить</button> */}
          </li>
        );
      })}
    </ul>
  );
}
