'use client';

import { useCallback, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3002';

export type ParticipantItem = { userId: string; userName: string | null; joinedAt: string };

export type RoomChatMessageItem = {
  id: string;
  userId: string;
  userName: string | null;
  body: string;
  createdAt: string;
};

export type PlaybackState = { currentTime?: number; playing?: boolean };

export function useRoomSocket(
  roomId: string,
  callbacks: {
    setParticipants: (p: ParticipantItem[]) => void;
    setStatus: (s: string) => void;
    setCurrentRoundIndex: (n: number) => void;
    onPlaybackState?: (state: PlaybackState) => void;
    onChatMessage?: (msg: RoomChatMessageItem) => void;
    onHandRaised?: (userId: string, raised: boolean) => void;
    onRoundLeaderChosen?: (leaderUserId: string) => void;
    currentUserId?: string | null;
  }
) {
  const ref = useRef(callbacks);
  const socketRef = useRef<Socket | null>(null);
  useEffect(() => {
    ref.current = callbacks;
  }, [callbacks]);

  const emitRoundLeaderChosen = useCallback(
    (leaderUserId: string) => {
      const s = socketRef.current;
      if (s?.connected) s.emit('round_leader_chosen', { roomId, leaderUserId });
    },
    [roomId]
  );

  const emitPlaybackState = useCallback(
    (state: PlaybackState) => {
      const s = socketRef.current;
      if (s?.connected) s.emit('playback_state', { roomId, ...state });
    },
    [roomId]
  );

  const emitHandRaise = useCallback(
    (raised: boolean) => {
      const s = socketRef.current;
      const userId = ref.current.currentUserId;
      if (s?.connected && userId) s.emit('hand_raised', { roomId, userId, raised });
    },
    [roomId]
  );

  useEffect(() => {
    const socket = io(WS_URL, { path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.emit('join_room', { roomId });

    socket.on('participants_updated', (data: { participants?: ParticipantItem[] }) => {
      if (Array.isArray(data?.participants)) {
        ref.current.setParticipants(data.participants);
      }
    });

    socket.on('room_state_updated', (data: { status?: string; currentRoundIndex?: number }) => {
      if (data.status != null) ref.current.setStatus(data.status);
      if (typeof data.currentRoundIndex === 'number') ref.current.setCurrentRoundIndex(data.currentRoundIndex);
    });

    socket.on('playback_state', (data: PlaybackState) => {
      ref.current.onPlaybackState?.(data);
    });

    socket.on('room_chat_message', (data: RoomChatMessageItem) => {
      ref.current.onChatMessage?.(data);
    });

    socket.on('hand_raised', (data: { userId?: string; raised?: boolean }) => {
      if (data.userId != null) ref.current.onHandRaised?.(data.userId, data.raised !== false);
    });

    socket.on('round_leader_chosen', (data: { leaderUserId?: string }) => {
      if (data.leaderUserId) ref.current.onRoundLeaderChosen?.(data.leaderUserId);
    });

    return () => {
      socket.emit('leave_room', { roomId });
      socket.removeAllListeners();
      socketRef.current = null;
      setTimeout(() => socket.disconnect(), 50);
    };
  }, [roomId]);

  return { emitPlaybackState, emitHandRaise, emitRoundLeaderChosen };
}
