'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3002';

export interface DmNewMessagePayload {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string | null;
  body: string;
  attachmentUrl?: string;
  attachmentType?: string;
  createdAt: string;
}

export interface DmReadReceiptPayload {
  readerId: string;
}

type UseDMSocketOptions = {
  peerUserId?: string | null;
  myUserName?: string | null;
  onTyping?: (userId: string, userName: string | null) => void;
  onTypingStop?: (userId: string) => void;
  onReadReceipt?: (readerId: string) => void;
};

/**
 * Подписка на real-time DM. Подключается с токеном, слушает dm_new_message, dm_typing, dm_read_receipt.
 */
export function useDMSocket(
  onNewMessage?: (msg: DmNewMessagePayload) => void,
  enabled = true,
  options: UseDMSocketOptions = {}
) {
  const { peerUserId, myUserName, onTyping, onTypingStop, onReadReceipt } = options;
  const onNewMessageRef = useRef(onNewMessage);
  const onTypingRef = useRef(onTyping);
  const onTypingStopRef = useRef(onTypingStop);
  const onReadReceiptRef = useRef(onReadReceipt);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
    onTypingRef.current = onTyping;
    onTypingStopRef.current = onTypingStop;
    onReadReceiptRef.current = onReadReceipt;
  }, [onNewMessage, onTyping, onTypingStop, onReadReceipt]);

  useEffect(() => {
    if (!enabled) {
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

        socket.on('dm_new_message', (data: DmNewMessagePayload) => {
          onNewMessageRef.current?.(data);
        });
        socket.on('dm_typing', (data: { userId: string; userName: string | null }) => {
          onTypingRef.current?.(data.userId, data.userName ?? null);
        });
        socket.on('dm_typing_stop', (data: { userId: string }) => {
          onTypingStopRef.current?.(data.userId);
        });
        socket.on('dm_read_receipt', (data: { readerId: string }) => {
          onReadReceiptRef.current?.(data.readerId);
        });
      } catch (e) {
        console.warn('[useDMSocket] Failed to connect:', e);
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
  }, [enabled]);

  const emitTyping = useCallback(() => {
    if (peerUserId && socketRef.current?.connected) {
      socketRef.current.emit('dm_typing', { toUserId: peerUserId, userName: myUserName ?? null });
    }
  }, [peerUserId, myUserName]);

  const emitTypingStop = useCallback(() => {
    if (peerUserId && socketRef.current?.connected) {
      socketRef.current.emit('dm_typing_stop', { toUserId: peerUserId });
    }
  }, [peerUserId]);

  return { connected, emitTyping, emitTypingStop };
}
