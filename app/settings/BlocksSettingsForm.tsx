'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/components/i18n/LanguageProvider';

type BlockedUser = { id: string; name: string | null; image: string | null };

export function BlocksSettingsForm() {
  const { t } = useTranslation();
  const [list, setList] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch('/api/me/blocks', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setList(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  async function handleUnblock(userId: string) {
    const res = await fetch(`/api/me/blocks/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) setList((prev) => prev.filter((u) => u.id !== userId));
  }

  if (loading) {
    return <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('common.loading', 'Загрузка…')}</p>;
  }

  if (list.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {t('settings.noBlocked', 'Нет заблокированных пользователей.')}
      </p>
    );
  }

  return (
    <ul className="list-none p-0 m-0 space-y-2">
      {list.map((u) => (
        <li
          key={u.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 12,
            background: 'var(--studio-participant-bg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {u.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={u.image} alt="" width={36} height={36} style={{ borderRadius: 8, objectFit: 'cover' }} />
            ) : (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'var(--bg-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                {(u.name ?? u.id).slice(0, 1).toUpperCase()}
              </div>
            )}
            <span>{u.name ?? t('common.member', 'Участник')}</span>
          </div>
          <button
            type="button"
            onClick={() => handleUnblock(u.id)}
            className="platform-btn platform-btn-sm"
            style={{ padding: '6px 12px' }}
          >
            {t('settings.unblock', 'Разблокировать')}
          </button>
        </li>
      ))}
    </ul>
  );
}
