import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { getConnectedSocket } from '@/lib/socket';

export type ParticipantItem = {
  userId: string;
  userName?: string | null;
  isLeader?: boolean;
};

export type PlaybackState = {
  currentTime?: number;
  playing?: boolean;
};

export type RoomChatMessageItem = {
  id: string;
  senderId: string;
  senderName?: string | null;
  body: string;
  createdAt: string;
};

/**
 * Room socket for watch-together and chat. Connects with ws-token, joins room by roomId.
 */
export function useRoomSocket(
  roomId: string | undefined,
  options: {
    onParticipants?: (participants: ParticipantItem[]) => void;
    onRoomState?: (data: { status?: string; currentRoundIndex?: number }) => void;
    onPlaybackState?: (data: PlaybackState) => void;
    onChatMessage?: (data: RoomChatMessageItem) => void;
  } = {}
) {
  const { onParticipants, onRoomState, onPlaybackState, onChatMessage } = options;
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const refs = useRef(options);
  refs.current = options;

  useEffect(() => {
    if (!roomId) {
      setConnected(false);
      return;
    }

    let cancelled = false;
    getConnectedSocket()
      .then((socket) => {
        if (cancelled) return;
        socketRef.current = socket;
        socket.emit('join_room', { roomId });
        setConnected(socket.connected);

        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));
        socket.on('participants_updated', (data: { participants?: ParticipantItem[] }) => {
          refs.current.onParticipants?.(data.participants ?? []);
        });
        socket.on('room_state_updated', (data: { status?: string; currentRoundIndex?: number }) => {
          refs.current.onRoomState?.(data);
        });
        socket.on('playback_state', (data: PlaybackState) => {
          refs.current.onPlaybackState?.(data);
        });
        socket.on('room_chat_message', (data: RoomChatMessageItem) => {
          refs.current.onChatMessage?.(data);
        });
      })
      .catch(() => setConnected(false));

    return () => {
      cancelled = true;
      const s = socketRef.current;
      socketRef.current = null;
      if (s) {
        s.emit('leave_room', { roomId });
        s.off('participants_updated');
        s.off('room_state_updated');
        s.off('playback_state');
        s.off('room_chat_message');
      }
      setConnected(false);
    };
  }, [roomId]);

  const emitPlaybackState = useCallback((currentTime?: number, playing?: boolean) => {
    if (roomId && socketRef.current?.connected) {
      socketRef.current.emit('playback_state', { roomId, currentTime, playing });
    }
  }, [roomId]);

  const emitHandRaise = useCallback((raised: boolean) => {
    if (roomId && socketRef.current?.connected) {
      socketRef.current.emit('hand_raised', { roomId, raised });
    }
  }, [roomId]);

  const emitRoundLeaderChosen = useCallback((leaderUserId: string) => {
    if (roomId && socketRef.current?.connected) {
      socketRef.current.emit('round_leader_chosen', { roomId, leaderUserId });
    }
  }, [roomId]);

  return {
    connected,
    emitPlaybackState,
    emitHandRaise,
    emitRoundLeaderChosen,
  };
}
