'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { fetchRoomTicket } from '@/lib/room-ticket';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3002';


/** Собираем один поток из карты потоков по userId */
function mergeRemoteStreams(streamsMap: Map<string, MediaStream>): MediaStream {
  const merged = new MediaStream();
  streamsMap.forEach((stream) => {
    stream.getTracks().forEach((track) => merged.addTrack(track));
  });
  return merged;
}

export function useRoomVoice(
  roomId: string,
  opts: {
    currentUserId: string | null;
    leaderUserId: string | null;
    otherParticipantIds: string[];
    isLeader: boolean;
    enabled: boolean;
  }
) {
  const { currentUserId, otherParticipantIds, enabled, isLeader } = opts;
  const otherIdsKey = otherParticipantIds.join(',');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const setMutedRef = useRef<(muted: boolean) => void>(() => {});
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingUserId, setSpeakingUserId] = useState<string | null>(null);
  const [remoteMicMuted, setRemoteMicMuted] = useState<Map<string, boolean>>(new Map());

  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const analyserIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isMutedRef = useRef(false);
  const hasRemoteStreamRef = useRef(false);
  useEffect(() => {
    isMutedRef.current = isMuted;
    hasRemoteStreamRef.current = !!remoteStream;
  }, [isMuted, remoteStream]);

  useEffect(() => {
    if (!enabled || !currentUserId || !roomId) return;
    const socket = io(WS_URL, { path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    // Получаем ticket и выполняем join_room
    fetchRoomTicket(roomId).then((ticket) => {
      const onConnect = () => socket.emit('join_room', { roomId, ticket });
      if (socket.connected) onConnect();
      else socket.once('connect', onConnect);
    });

    socket.on('room_join_error', (data: { error?: string }) => {
      console.warn('[useRoomVoice] join_room rejected:', data?.error);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    });

    return () => {
      socket.emit('leave_room', { roomId });
      socket.removeAllListeners();
      socketRef.current = null;
      setTimeout(() => socket.disconnect(), 50);
    };
  }, [enabled, roomId, currentUserId]);


  useEffect(() => {
    if (!enabled || !socketRef.current) return;
    const socket = socketRef.current;

    const cleanup = () => {
      hasRemoteStreamRef.current = false;
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      pendingCandidatesRef.current.clear();
      remoteStreamsRef.current.clear();
      setRemoteStream(null);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (analyserIntervalRef.current) clearInterval(analyserIntervalRef.current);
      analyserIntervalRef.current = null;
      audioContextRef.current?.close();
      audioContextRef.current = null;
      setSpeakingUserId(null);
      setIsSpeaking(false);
    };

    const addRemoteTrack = (fromUserId: string, stream: MediaStream) => {
      const map = remoteStreamsRef.current;
      if (!map.has(fromUserId)) map.set(fromUserId, new MediaStream());
      const userStream = map.get(fromUserId)!;
      stream.getTracks().forEach((track) => {
        if (!userStream.getTracks().includes(track)) userStream.addTrack(track);
      });
      setRemoteStream(mergeRemoteStreams(new Map(map)));
    };

    const onOffer = (payload: { fromUserId: string; toUserId: string; sdp?: object }) => {
      if (payload.toUserId !== currentUserId || !payload.sdp) return;
      const fromUserId = payload.fromUserId;
      if (fromUserId >= currentUserId) return;
      const existing = peerConnectionsRef.current.get(fromUserId);
      if (existing && existing.signalingState !== 'closed') return;
      if (existing) existing.close();
      peerConnectionsRef.current.delete(fromUserId);

      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      peerConnectionsRef.current.set(fromUserId, pc);
      pc.ontrack = (e) => {
        if (e.streams[0]) addRemoteTrack(fromUserId, e.streams[0]);
      };
      pc.onicecandidate = (e) => {
        if (e.candidate && socketRef.current)
          socketRef.current.emit('voice_ice', {
            roomId,
            fromUserId: currentUserId,
            toUserId: fromUserId,
            candidate: e.candidate.toJSON(),
          });
      };

      const localStream = localStreamRef.current;
      if (localStream) localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

      pc.setRemoteDescription(new RTCSessionDescription(payload.sdp as RTCSessionDescriptionInit))
        .then(() => pc.createAnswer())
        .then((answer) => pc.setLocalDescription(answer))
        .then(() => {
          if (socketRef.current && pc.localDescription)
            socketRef.current.emit('voice_answer', {
              roomId,
              fromUserId: currentUserId,
              toUserId: fromUserId,
              sdp: pc.localDescription,
            });
        })
        .catch(() => {});

      const pending = pendingCandidatesRef.current.get(fromUserId);
      pending?.forEach((c) => pc.addIceCandidate(new RTCIceCandidate(c)));
      pendingCandidatesRef.current.delete(fromUserId);
    };

    const onAnswer = (payload: { fromUserId: string; toUserId: string; sdp?: object }) => {
      if (payload.toUserId !== currentUserId) return;
      const pc = peerConnectionsRef.current.get(payload.fromUserId);
      if (!pc || !payload.sdp || pc.signalingState !== 'have-local-offer') return;
      pc.setRemoteDescription(new RTCSessionDescription(payload.sdp as RTCSessionDescriptionInit))
        .then(() => {
          const pending = pendingCandidatesRef.current.get(payload.fromUserId);
          pending?.forEach((c) => pc.addIceCandidate(new RTCIceCandidate(c)));
          pendingCandidatesRef.current.delete(payload.fromUserId);
        })
        .catch(() => {});
    };

    const onIce = (payload: { fromUserId: string; toUserId: string; candidate?: object }) => {
      if (payload.toUserId !== currentUserId) return;
      const pc = peerConnectionsRef.current.get(payload.fromUserId);
      if (!pc) return;
      const c = payload.candidate as RTCIceCandidateInit | undefined;
      if (!c) return;
      if (pc.remoteDescription) pc.addIceCandidate(new RTCIceCandidate(c));
      else {
        const list = pendingCandidatesRef.current.get(payload.fromUserId) ?? [];
        list.push(c);
        pendingCandidatesRef.current.set(payload.fromUserId, list);
      }
    };

    socket.on('voice_offer', onOffer);
    socket.on('voice_answer', onAnswer);
    socket.on('voice_ice', onIce);
    socket.on('voice_activity', (payload: { userId?: string; speaking?: boolean }) => {
      if (payload.userId && payload.userId !== currentUserId)
        setSpeakingUserId(payload.speaking ? payload.userId : null);
    });
    socket.on('voice_muted', (payload: { userId?: string; muted?: boolean }) => {
      if (payload.userId && payload.userId !== currentUserId) {
        setRemoteMicMuted((prev) => {
          const next = new Map(prev);
          next.set(payload.userId!, payload.muted ?? false);
          return next;
        });
      }
    });
    socket.on('room_mute_user', (payload: { targetUserId?: string }) => {
      if (payload?.targetUserId === currentUserId) setMutedRef.current(true);
    });
    socket.on('room_mute_all', () => setMutedRef.current(true));

    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        localStreamRef.current = stream;
        setError(null);
        socket.emit('voice_muted', { roomId, userId: currentUserId, muted: isMutedRef.current });
        try {
          const ctx = new AudioContext();
          audioContextRef.current = ctx;
          ctx.resume().catch(() => {});
          const src = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.7;
          src.connect(analyser);
          const data = new Uint8Array(analyser.frequencyBinCount);
          const SPEAK_THRESHOLD = 12;
          let lastEmit = false;
          analyserIntervalRef.current = setInterval(() => {
            if (!socketRef.current || isMutedRef.current) return;
            if (ctx.state === 'suspended') {
              ctx.resume().catch(() => {});
              return;
            }
            analyser.getByteFrequencyData(data);
            const avg = data.reduce((a, b) => a + b, 0) / data.length;
            const speaking = avg > SPEAK_THRESHOLD;
            setIsSpeaking(speaking);
            if (speaking !== lastEmit) {
              lastEmit = speaking;
              socketRef.current.emit('voice_activity', {
                roomId,
                userId: currentUserId,
                speaking,
              });
            }
          }, 120);
        } catch {
          // Analyser not critical
        }

        if (!currentUserId) return;
        const myUserId = currentUserId;
        otherParticipantIds.forEach((toUserId) => {
          if (toUserId === myUserId) return;
          if (myUserId >= toUserId) return;
          const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
          });
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
          peerConnectionsRef.current.set(toUserId, pc);

          pc.ontrack = (e) => {
            if (e.streams[0]) addRemoteTrack(toUserId, e.streams[0]);
          };
          pc.onicecandidate = (e) => {
            if (e.candidate && socketRef.current)
              socketRef.current.emit('voice_ice', {
                roomId,
                fromUserId: myUserId,
                toUserId,
                candidate: e.candidate.toJSON(),
              });
          };

          pc.createOffer()
            .then((offer) => pc.setLocalDescription(offer))
            .then(() => {
              if (socketRef.current && pc.localDescription)
                socketRef.current.emit('voice_offer', {
                  roomId,
                  fromUserId: myUserId,
                  toUserId,
                  sdp: pc.localDescription,
                });
            })
            .catch((err) => setError(err?.message ?? 'Ошибка создания offer'));
        });
      })
      .catch((err) => setError(err?.message ?? 'Нет доступа к микрофону'));

    return () => {
      socket.off('voice_offer', onOffer);
      socket.off('voice_answer', onAnswer);
      socket.off('voice_ice', onIce);
      socket.off('voice_activity');
      socket.off('voice_muted');
      socket.off('room_mute_user');
      socket.off('room_mute_all');
      cleanup();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, roomId, currentUserId, otherIdsKey]);

  const setMuted = useCallback(
    (muted: boolean) => {
      setIsMuted(muted);
      localStreamRef.current?.getTracks().forEach((t) => {
        if (t.kind === 'audio') t.enabled = !muted;
      });
      if (socketRef.current && currentUserId) {
        socketRef.current.emit('voice_muted', { roomId, userId: currentUserId, muted });
        if (muted) {
          socketRef.current.emit('voice_activity', { roomId, userId: currentUserId, speaking: false });
          setIsSpeaking(false);
        }
      }
    },
    [roomId, currentUserId]
  );

  useEffect(() => {
    setMutedRef.current = setMuted;
  }, [setMuted]);

  const emitMuteUser = useCallback(
    (targetUserId: string) => {
      if (socketRef.current?.connected && isLeader)
        socketRef.current.emit('room_mute_user', { roomId, targetUserId });
    },
    [roomId, isLeader]
  );
  const emitMuteAll = useCallback(() => {
    if (socketRef.current?.connected && isLeader) socketRef.current.emit('room_mute_all', { roomId });
  }, [roomId, isLeader]);

  const resumeAudioContext = useCallback(() => {
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
  }, []);

  return {
    remoteStream,
    isMuted,
    setMuted,
    emitMuteUser,
    emitMuteAll,
    remoteMicMuted,
    error,
    isSpeaking,
    speakingUserId: speakingUserId ?? (isSpeaking ? currentUserId : null),
    resumeAudioContext,
  };
}
