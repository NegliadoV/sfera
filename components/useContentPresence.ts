'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3002';
const TYPING_STALE_MS = 5000;

export type TypingUser = { userId: string; userName: string | null };

type TypingEntry = { userId: string; userName: string | null; at: number };

export function useContentPresence(
  contentId: string,
  currentUser: { userId: string; userName: string | null } | null
) {
  const [entries, setEntries] = useState<TypingEntry[]>([]);
  const [presenceUsers, setPresenceUsers] = useState<TypingUser[]>([]);
  const [now, setNow] = useState(0);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setNow(Date.now());
    }, 0);
    const idInterval = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(id);
      clearInterval(idInterval);
    };
  }, []);

  const freshEntries = now > 0 ? entries.filter((e) => now - e.at < TYPING_STALE_MS) : [];
  const typingUsers: TypingUser[] = freshEntries.map((e) => ({ userId: e.userId, userName: e.userName }));

  useEffect(() => {
    const socket = io(WS_URL, { path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.emit('join_content', {
      contentId,
      userId: currentUser?.userId,
      userName: currentUser?.userName ?? null,
    });

    socket.on('presence_list', (data: { users: TypingUser[] }) => {
      const list = Array.isArray(data?.users) ? data.users : [];
      setPresenceUsers(list.filter((u) => u.userId !== currentUser?.userId));
    });

    socket.on('user_typing', (data: { userId: string; userName: string | null }) => {
      const at = Date.now();
      setEntries((prev) => {
        const rest = prev.filter((u) => u.userId !== data.userId);
        return [...rest, { userId: data.userId, userName: data.userName ?? null, at }];
      });
    });

    socket.on('user_stopped_typing', (data: { userId: string }) => {
      setEntries((prev) => prev.filter((u) => u.userId !== data.userId));
    });

    const interval = setInterval(() => {
      const t = Date.now();
      setEntries((prev) => prev.filter((e) => t - e.at < TYPING_STALE_MS));
    }, 1500);

    return () => {
      clearInterval(interval);
      socket.emit('leave_content', { contentId });
      socket.removeAllListeners();
      socketRef.current = null;
      setTimeout(() => socket.disconnect(), 50);
    };
  }, [contentId, currentUser?.userId, currentUser?.userName]);

  const emitTypingStart = useCallback(() => {
    if (!currentUser || !socketRef.current) return;
    socketRef.current.emit('typing_start', {
      contentId,
      userId: currentUser.userId,
      userName: currentUser.userName,
    });
  }, [contentId, currentUser]);

  const emitTypingStop = useCallback(() => {
    if (!currentUser || !socketRef.current) return;
    socketRef.current.emit('typing_stop', {
      contentId,
      userId: currentUser.userId,
      userName: currentUser.userName,
    });
  }, [contentId, currentUser]);

  return {
    typingUsers: typingUsers.filter((u) => u.userId !== currentUser?.userId),
    presenceUsers,
    emitTypingStart,
    emitTypingStop,
  };
}
