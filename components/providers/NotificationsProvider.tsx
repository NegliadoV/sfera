'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';

export type NotificationItem = {
  id: string;
  contentId: string;
  slug: string;
  title: string;
  type: string;
  read: boolean;
  createdAt: string;
};

type NotificationsContextType = {
  items: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextType>({
  items: [],
  unreadCount: 0,
  loading: true,
  fetchNotifications: async () => {},
  markAllAsRead: async () => {},
  markAsRead: async () => {},
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const isFetchingRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await fetch('/api/me/notifications', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch (e) {
      console.warn('Failed to fetch notifications:', e);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Первоначальная загрузка и периодическое обновление (каждые 60 сек, без дублирования)
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Обновление при фокусе окна
  useEffect(() => {
    const onFocus = () => fetchNotifications();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchNotifications]);

  // Отметить все как прочитанные
  const markAllAsRead = useCallback(async () => {
    // Оптимистичное обновление
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
    try {
      await fetch('/api/me/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ markAll: true }),
      });
    } catch (e) {
      console.warn('Failed to mark all as read:', e);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // Отметить одно как прочитанное
  const markAsRead = useCallback(async (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await fetch('/api/me/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
    } catch (e) {
      console.warn('Failed to mark notification as read:', e);
    }
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        items,
        unreadCount,
        loading,
        fetchNotifications,
        markAllAsRead,
        markAsRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
