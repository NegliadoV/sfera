import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { getConnectedSocket, disconnectSocket } from '@/lib/socket';

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

type UseDMSocketOptions = {
  peerUserId?: string | null;
  myUserName?: string | null;
  onTyping?: (userId: string, userName: string | null) => void;
  onTypingStop?: (userId: string) => void;
  onReadReceipt?: (readerId: string) => void;
};

/**
 * Real-time DM socket for mobile. Connects with ws-token (Bearer JWT).
 * Use when a DM chat screen is mounted.
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
    getConnectedSocket()
      .then((socket) => {
        if (cancelled) {
          socket.disconnect();
          return;
        }
        socketRef.current = socket;
        setConnected(socket.connected);

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
      })
      .catch(() => {
        if (!cancelled) setConnected(false);
      });

    return () => {
      cancelled = true;
      const s = socketRef.current;
      socketRef.current = null;
      if (s) {
        s.off('connect');
        s.off('disconnect');
        s.off('dm_new_message');
        s.off('dm_typing');
        s.off('dm_typing_stop');
        s.off('dm_read_receipt');
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

/** Call on logout to disconnect shared socket. */
export { disconnectSocket };
