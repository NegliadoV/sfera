'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

type NotificationItem = {
  id: string;
  contentId: string;
  slug: string;
  title: string;
  type: string;
  read: boolean;
  createdAt: string;
};

const DROPDOWN_WIDTH = 320;
const VIEWPORT_PADDING = 8;

export function NotificationsDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; maxHeight: number } | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/me/notifications', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setItems(data.items ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch (e) {
      console.warn('Failed to fetch notifications:', e);
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
      const target = e.target as Node;
      if (ref.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open || !triggerRef.current || typeof window === 'undefined') {
      setDropdownPosition(null);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    const maxLeft = window.innerWidth - DROPDOWN_WIDTH - VIEWPORT_PADDING;
    const left = Math.min(Math.max(VIEWPORT_PADDING, rect.right - DROPDOWN_WIDTH), maxLeft);
    const top = rect.bottom + 8;
    const maxHeight = Math.min(400, window.innerHeight - top - VIEWPORT_PADDING);
    setDropdownPosition({ top, left, maxHeight });
  }, [open]);

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
        ref={triggerRef}
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
      {open && dropdownPosition && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className="notifications-dropdown"
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: DROPDOWN_WIDTH,
            maxHeight: dropdownPosition.maxHeight,
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
                    <span style={{ fontWeight: 500, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {n.type === 'save' ? (
                        <><i className="fa-solid fa-project-diagram text-[var(--accent-primary)]"></i> Сохранено в Карту</>
                      ) : (
                        <><i className="fa-solid fa-bell text-blue-400"></i> Новый пост</>
                      )}
                    </span>
                    <div style={{ marginTop: 4, fontSize: '0.85rem', opacity: 0.9 }}>
                      {n.title.length > 60 ? `${n.title.slice(0, 60)}…` : n.title}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
