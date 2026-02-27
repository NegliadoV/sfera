'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3002';

export interface GroupNewMessagePayload {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string | null;
  body: string;
  attachmentUrl?: string;
  attachmentType?: string;
  createdAt: string;
}

/**
 * Подписка на group_new_message для группового чата.
 * Слушает события, доставленные в user:${userId} (нотификация).
 */
export function useGroupSocket(
  groupId: string | null,
  onNewMessage?: (msg: GroupNewMessagePayload) => void,
  enabled = true
) {
  const onNewMessageRef = useRef(onNewMessage);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    if (!enabled || !groupId) {
      setConnected(false);
      return;
    }

    let cancelled = false;
    let socket: Socket | null = null;

    const connect = async () => {
      try {
        const res = await fetch('/api/me/ws-token', { credentials: 'include' });
        if (!res.ok || cancelled) return;
        const { token } = await res.json();
        if (!token || cancelled) return;

        socket = io(WS_URL, {
          path: '/socket.io',
          transports: ['websocket', 'polling'],
          auth: { token },
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          if (!cancelled) setConnected(true);
        });
        socket.on('disconnect', () => {
          if (!cancelled) setConnected(false);
        });

        socket.on('group_new_message', (data: GroupNewMessagePayload) => {
          if (data.groupId === groupId) {
            onNewMessageRef.current?.(data);
          }
        });
      } catch (e) {
        console.warn('[useGroupSocket] Failed to connect:', e);
      }
    };

    connect();

    return () => {
      cancelled = true;
      setConnected(false);
      const s = socket;
      if (s) {
        s.removeAllListeners();
        socketRef.current = null;
        setTimeout(() => s.disconnect(), 50);
      }
    };
  }, [enabled, groupId]);

  return { connected };
}
