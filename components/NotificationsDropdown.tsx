'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

type NotificationItem = {
  id: string;
  contentId: string;
  slug: string;
  title: string;
  read: boolean;
  createdAt: string;
};

export function NotificationsDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/me/notifications', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setItems(data.items ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [pathname]);

  useEffect(() => {
    const onFocus = () => fetchNotifications();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    const res = await fetch('/api/me/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ markAll: true }),
    });
    if (res.ok) {
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const markAsRead = async (id: string) => {
    const res = await fetch('/api/me/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          const willOpen = !open;
          setOpen(willOpen);
          if (willOpen && unreadCount > 0) markAllAsRead();
        }}
        className="glass-icon-btn"
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
        }}
        title="Уведомления"
      >
        <i className="fas fa-bell" />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              background: 'var(--accent-red, #ef4444)',
              color: 'white',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div
          className="notifications-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            overflowY: 'auto',
            background: 'var(--studio-panel-bg)',
            borderRadius: 16,
            border: '1px solid var(--studio-panel-border)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
            zIndex: 200,
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-color)',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            Уведомления
          </div>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
              Загрузка…
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
              Нет новых уведомлений
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {items.map((n) => (
                <li key={n.id}>
                  <a
                    href={`/universes/${n.slug}/content/${n.contentId}`}
                    onClick={async (e) => {
                      e.preventDefault();
                      setOpen(false);
                      await markAsRead(n.id);
                      router.push(`/universes/${n.slug}/content/${n.contentId}`);
                    }}
                    style={{
                      display: 'block',
                      padding: '12px 16px',
                      textDecoration: 'none',
                      color: 'var(--text-primary)',
                      borderBottom: '1px solid var(--border-color)',
                      background: n.read ? 'transparent' : 'rgba(59, 130, 246, 0.06)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--hover-color, rgba(255,255,255,0.05))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(59, 130, 246, 0.06)';
                    }}
                  >
                    <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>Новый пост</span>
                    <div style={{ marginTop: 4, fontSize: '0.85rem', opacity: 0.9 }}>
                      {n.title.length > 60 ? `${n.title.slice(0, 60)}…` : n.title}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
