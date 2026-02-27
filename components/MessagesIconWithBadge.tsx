'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function MessagesIconWithBadge() {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  function fetchCount() {
    fetch('/api/me/messages-badge', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { total?: number }) => {
        if (typeof data?.total === 'number') setCount(data.total);
      })
      .catch(() => {});
  }

  useEffect(() => {
    fetchCount();
  }, [pathname]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchCount();
    };
    const onRefresh = () => fetchCount();
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('messages-badge-refresh', onRefresh);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('messages-badge-refresh', onRefresh);
    };
  }, []);

  return (
    <Link
      href="/messages"
      className="glass-icon-btn"
      style={{
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        color: 'var(--studio-meta-color)',
        textDecoration: 'none',
        position: 'relative',
      }}
      title="Сообщения"
    >
      <i className="fa-regular fa-message" style={{ fontSize: '1rem' }} />
      {count > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            minWidth: 18,
            height: 18,
            padding: '0 5px',
            fontSize: '0.7rem',
            fontWeight: 600,
            lineHeight: '18px',
            textAlign: 'center',
            color: 'white',
            background: 'var(--accent-primary)',
            borderRadius: 9,
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
