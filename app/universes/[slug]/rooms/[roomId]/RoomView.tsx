'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRoomSocket } from './useRoomSocket';
import type { RoomChatMessageItem, PlaybackState } from './useRoomSocket';
import { useRoomVoice } from './useRoomVoice';
import { RoomSyncPlayer } from './RoomSyncPlayer';
import { RoomChat } from './RoomChat';

function dedupeParticipants(
  participants: Array<{ userId: string; userName: string | null; joinedAt: string }>
) {
  const seen = new Set<string>();
  return participants.filter((p) => {
    if (seen.has(p.userId)) return false;
    seen.add(p.userId);
    return true;
  });
}

function HandIcon() {
  return (
    <span className="text-lg leading-none shrink-0" role="img" aria-label="Рука поднята">
      ✋
    </span>
  );
}

function MicOffIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function VolumeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

type RoomData = {
  id: string;
  title: string;
  status: string;
  contentId: string | null;
  timeLimitMinutes: number | null;
  currentRoundIndex: number;
  startedAt: string | null;
  finishedAt: string | null;
  rounds: Array<{ id: string; name: string; orderIndex: number; durationMinutes: number | null }>;
  participants: Array<{ userId: string; userName: string | null; joinedAt: string }>;
};

export function RoomView({
  slug,
  roomId,
  room,
  currentUserId,
  isParticipant,
  isCreator,
}: {
  slug: string;
  roomId: string;
  room: RoomData;
  currentUserId: string | null;
  isParticipant: boolean;
  isCreator: boolean;
}) {
  const [participants, setParticipants] = useState(room.participants);
  const [status, setStatus] = useState(room.status);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(room.currentRoundIndex);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<RoomChatMessageItem[]>([]);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [content, setContent] = useState<{ type: string; url: string | null; title: string } | null>(null);
  const [sendLoading, setSendLoading] = useState(false);
  const router = useRouter();

  /** Участник с сервера или уже добавлен локально после "Войти в комнату" (без перезагрузки) */
  const effectiveIsParticipant =
    isParticipant || (!!currentUserId && participants.some((p) => p.userId === currentUserId));

  /** Участники по порядку входа */
  const participantsByJoinOrder = useMemo(
    () => [...dedupeParticipants(participants)].sort(
      (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
    ),
    [participants]
  );

  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const [raisedHandsOrder, setRaisedHandsOrder] = useState<string[]>([]);
  const [overrideLeaderUserId, setOverrideLeaderUserId] = useState<string | null>(null);

  const { emitPlaybackState, emitHandRaise, emitRoundLeaderChosen } = useRoomSocket(roomId, {
    setParticipants,
    setStatus,
    setCurrentRoundIndex,
    currentUserId,
    onPlaybackState: setPlaybackState,
    onChatMessage: useCallback((msg: RoomChatMessageItem) => {
      setChatMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    }, []),
    onHandRaised: useCallback((userId: string, raised: boolean) => {
      setRaisedHands((prev) => {
        const next = new Set(prev);
        if (raised) next.add(userId);
        else next.delete(userId);
        return next;
      });
      setRaisedHandsOrder((prev) => {
        if (raised) return prev.includes(userId) ? prev : [...prev, userId];
        return prev.filter((id) => id !== userId);
      });
    }, []),
    onRoundLeaderChosen: useCallback((leaderUserId: string) => {
      setOverrideLeaderUserId(leaderUserId);
      setRaisedHands((prev) => {
        const next = new Set(prev);
        next.delete(leaderUserId);
        return next;
      });
      setRaisedHandsOrder((prev) => prev.filter((id) => id !== leaderUserId));
    }, []),
  });

  const currentLeader = useMemo(() => {
    if (participantsByJoinOrder.length === 0) return null;
    if (overrideLeaderUserId) {
      const p = participantsByJoinOrder.find((x) => x.userId === overrideLeaderUserId);
      if (p) return p;
    }
    return participantsByJoinOrder[currentRoundIndex % participantsByJoinOrder.length];
  }, [participantsByJoinOrder, currentRoundIndex, overrideLeaderUserId]);

  const isCurrentUserLeader = !!currentUserId && currentLeader?.userId === currentUserId;
  /** Управление контентом (видео и т.д.) только у ведущего текущего раунда, когда комната идёт */
  const canControlContent = effectiveIsParticipant && status === 'ongoing' && isCurrentUserLeader;

  const myHandRaised = !!currentUserId && raisedHands.has(currentUserId);
  const toggleHand = () => {
    if (!currentUserId) return;
    const next = !myHandRaised;
    setRaisedHands((prev) => {
      const s = new Set(prev);
      if (next) s.add(currentUserId);
      else s.delete(currentUserId);
      return s;
    });
    setRaisedHandsOrder((prev) =>
      next ? (prev.includes(currentUserId) ? prev : [...prev, currentUserId]) : prev.filter((id) => id !== currentUserId)
    );
    emitHandRaise(next);
  };

  const otherParticipantIds = useMemo(
    () => participantsByJoinOrder.map((p) => p.userId).filter((id) => id !== currentUserId),
    [participantsByJoinOrder, currentUserId]
  );
  const voiceEnabled = effectiveIsParticipant && status === 'ongoing';
  const {
    remoteStream,
    isMuted,
    setMuted,
    emitMuteUser,
    emitMuteAll,
    remoteMicMuted,
    error: voiceError,
    isSpeaking,
    speakingUserId,
    resumeAudioContext,
  } = useRoomVoice(roomId, {
    currentUserId,
    leaderUserId: currentLeader?.userId ?? null,
    otherParticipantIds,
    isLeader: isCurrentUserLeader,
    enabled: voiceEnabled,
  });
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const [audioPlaybackUnlocked, setAudioPlaybackUnlocked] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  useEffect(() => {
    const el = remoteAudioRef.current;
    if (!el) return;
    if (remoteStream) {
      el.srcObject = remoteStream;
      el.volume = 1;
      el.muted = !soundOn;
      el.play().then(() => setAudioPlaybackUnlocked(true)).catch(() => {});
    } else {
      el.srcObject = null;
      setAudioPlaybackUnlocked(false);
    }
  }, [remoteStream, voiceEnabled, soundOn]);

  useEffect(() => {
    if (!room.contentId) return;
    let cancelled = false;
    fetch(`/api/content/${room.contentId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!cancelled && data) setContent({ type: data.type, url: data.url ?? null, title: data.title });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [room.contentId]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/universes/${slug}/rooms/${roomId}/messages`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setChatMessages(data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [slug, roomId]);

  async function sendMessage(body: string) {
    setSendLoading(true);
    try {
      const res = await fetch(`/api/universes/${slug}/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error('Send failed');
      const msg = await res.json();
      setChatMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    } finally {
      setSendLoading(false);
    }
  }

  async function join() {
    if (!currentUserId) return;
    setLoading('join');
    setError(null);
    try {
      const res = await fetch(`/api/universes/${slug}/rooms/${roomId}/join`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Ошибка ${res.status}`);
      }
      setParticipants((prev) => [
        ...prev,
        { userId: currentUserId, userName: null, joinedAt: new Date().toISOString() },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти');
    } finally {
      setLoading(null);
    }
  }

  async function leave() {
    if (!currentUserId) return;
    setLoading('leave');
    setError(null);
    try {
      const res = await fetch(`/api/universes/${slug}/rooms/${roomId}/leave`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Ошибка ${res.status}`);
      }
      router.push(`/universes/${slug}/rooms`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось выйти');
    } finally {
      setLoading(null);
    }
  }

  async function roomAction(action: 'start' | 'next_round' | 'finish') {
    setLoading(action);
    setError(null);
    try {
      if (action === 'next_round' && participantsByJoinOrder.length > 0) {
        const nextLeaderId =
          raisedHandsOrder[0] ?? participantsByJoinOrder[(currentRoundIndex + 1) % participantsByJoinOrder.length].userId;
        setRaisedHands((prev) => {
          const next = new Set(prev);
          next.delete(nextLeaderId);
          return next;
        });
        setRaisedHandsOrder((prev) => prev.filter((id) => id !== nextLeaderId));
        emitRoundLeaderChosen(nextLeaderId);
      }
      const res = await fetch(`/api/universes/${slug}/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Ошибка ${res.status}`);
      }
      const data = await res.json();
      if (data.status != null) setStatus(data.status);
      if (data.currentRoundIndex != null) setCurrentRoundIndex(data.currentRoundIndex);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось выполнить действие');
    } finally {
      setLoading(null);
    }
  }

  const uniqueParticipants = useMemo(() => dedupeParticipants(participants), [participants]);

  const STATUS_LABEL: Record<string, string> = {
    waiting: 'Ожидание',
    ongoing: 'Идёт',
    finished: 'Завершена',
  };

  const currentRound = room.rounds[currentRoundIndex];
  const roundDuration = currentRound?.durationMinutes ?? null;

  return (
    <div className="studio-page-wrap">
      <div className="studio-card" style={{ maxWidth: '1360px' }}>
        {/* Шапка */}
        <div className="studio-header">
          <div className="studio-title-section">
            <h1>{room.title}</h1>
            <div className="studio-meta">
              <span className="studio-status-badge">
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: status === 'ongoing' ? 'var(--studio-status-live-color)' : 'var(--studio-meta-color)', display: 'inline-block', marginRight: '6px' }} />
                {STATUS_LABEL[status] ?? status} {status === 'ongoing' && '· LIVE'}
              </span>
              {room.timeLimitMinutes != null && (
                <span>· лимит {room.timeLimitMinutes} мин</span>
              )}
            </div>
          </div>
        </div>

        {/* Основная сцена */}
        <div className="studio-main-stage">
          <div className="studio-video-area">
            {room.contentId && content ? (
              <div className="studio-video-player">
                <RoomSyncPlayer
                  content={content}
                  slug={slug}
                  contentId={room.contentId}
                  playbackState={playbackState}
                  onPlaybackChange={emitPlaybackState}
                  isParticipant={effectiveIsParticipant}
                  canControl={canControlContent}
                />
                {status === 'ongoing' && (
                  <div className="studio-video-overlay">
                    <div className="studio-live-tag">
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                      LIVE
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="studio-video-player">
                <div className="studio-video-placeholder">
                  <div style={{ fontSize: '5rem', opacity: 0.4, marginBottom: '16px' }}>▶</div>
                  <span style={{ display: 'block' }}>
                    {room.contentId ? 'Загрузка материала…' : 'Контент не добавлен'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Панель участников */}
          <div className="studio-panel">
            <div className="studio-panel-header">
              <span>👤 Участники ({uniqueParticipants.length})</span>
            </div>
            <div className="studio-participant-cards">
              {uniqueParticipants.map((p, i) => {
                const displayName = p.userName ?? p.userId.slice(0, 8);
                const initials = (p.userName ?? p.userId)
                  .trim()
                  .slice(0, 2)
                  .toUpperCase()
                  .replace(/\s/g, '') || p.userId.slice(0, 2).toUpperCase();
                const handUp = raisedHands.has(p.userId);
                const isSelf = p.userId === currentUserId;
                const micMuted = isSelf ? isMuted : (remoteMicMuted.get(p.userId) ?? false);
                const isLeader = currentLeader?.userId === p.userId;
                const isSpeakingNow = speakingUserId === p.userId;
                const partClass = `part-${(i % 3) + 1}`;
                return (
                  <div
                    key={`${p.userId}-${i}`}
                    className="studio-participant"
                    style={{
                      borderColor: isSpeakingNow ? 'var(--accent-green)' : undefined,
                      background: isSpeakingNow ? 'color-mix(in srgb, var(--accent-green) 15%, transparent)' : undefined,
                    }}
                  >
                    <div className={`studio-avatar ${partClass}`}>{initials}</div>
                    <div style={{ flex: 1 }}>
                      <div className="studio-name">{displayName}</div>
                      <div className="studio-handle">
                        {isLeader && <span>⭐ ведущий раунда</span>}
                        {!isLeader && <span>@{p.userId.slice(0, 8)}</span>}
                      </div>
                    </div>
                    <div className={`studio-mic-status ${micMuted ? 'mic-off' : ''}`} style={{ position: 'relative' }}>
                      {micMuted ? '🎤' : '🎙️'}
                      {isSpeakingNow && !micMuted && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: 'var(--accent-green)',
                            border: '2px solid var(--studio-panel-bg)',
                            animation: 'pulse 1.5s infinite',
                          }}
                          title="Говорит"
                        />
                      )}
                    </div>
                    {voiceEnabled && isCurrentUserLeader && !isSelf && (
                      <button
                        type="button"
                        onClick={() => emitMuteUser(p.userId)}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          color: '#e67e72',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Замутить участника"
                      >
                        <MicOffIcon className="shrink-0" style={{ width: '16px', height: '16px' }} />
                      </button>
                    )}
                    {handUp && (
                      <span style={{ fontSize: '1.2rem' }} title="Рука поднята">✋</span>
                    )}
                  </div>
                );
              })}
            </div>
            {voiceEnabled && (
              <div className="studio-voice-status-box">
                <span>🎧</span>
                <span>
                  Голос в комнате · {isMuted ? 'микрофон выключен' : 'микрофон включён'}
                  {!soundOn && ' · звук выключен'}
                  {voiceError && (
                    <span style={{ color: 'var(--accent-red)', marginLeft: '8px' }}>⚠ {voiceError}</span>
                  )}
                </span>
              </div>
            )}
            {voiceEnabled && isCurrentUserLeader && (
              <button
                type="button"
                onClick={() => emitMuteAll()}
                className="studio-ctrl-btn end-call"
                style={{ width: '100%', marginTop: '12px' }}
              >
                Замутить всех
              </button>
            )}
            {effectiveIsParticipant && status !== 'finished' && (
              <button
                type="button"
                onClick={toggleHand}
                className="studio-ctrl-btn special"
                style={{
                  width: '100%',
                  marginTop: '12px',
                  background: myHandRaised ? 'color-mix(in srgb, var(--accent-green) 15%, transparent)' : 'var(--studio-participant-bg)',
                  border: `1px solid ${myHandRaised ? 'var(--accent-green)' : 'var(--border-subtle)'}`,
                  color: myHandRaised ? 'var(--accent-green)' : 'var(--text-secondary)',
                }}
              >
                {myHandRaised ? '✋ Опустить руку' : '✋ Поднять руку'}
              </button>
            )}
          </div>
        </div>

        {/* Контрол-бар */}
        <div className="studio-control-bar">
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="studio-ctrl-btn"
              onClick={() => {
                resumeAudioContext();
                setMuted(!isMuted);
              }}
            >
              <span>{isMuted ? '🎤' : '🎙️'}</span>
              <span>{isMuted ? 'Выкл' : 'Вкл'}</span>
            </button>
            {voiceEnabled && remoteStream && (
              <button
                type="button"
                className="studio-ctrl-btn"
                onClick={() => setSoundOn(!soundOn)}
              >
                <span>{soundOn ? '🔊' : '🔇'}</span>
                <span>Звук</span>
              </button>
            )}
            <button
              type="button"
              className="studio-ctrl-btn special"
              onClick={toggleHand}
              disabled={!effectiveIsParticipant || status === 'finished'}
            >
              <span>✋</span>
              <span>{myHandRaised ? 'опустить руку' : 'поднять руку'}</span>
            </button>
            {effectiveIsParticipant && !isCreator && (
              <button
                type="button"
                className="studio-ctrl-btn end-call"
                onClick={leave}
                disabled={loading !== null}
              >
                <span>📞</span>
                <span>покинуть</span>
              </button>
            )}
          </div>
          <div className="studio-right-info">
            {status === 'ongoing' && currentRound && (
              <span>
                ⏱ раунд · {roundDuration != null ? `${roundDuration} мин` : 'без лимита'}
              </span>
            )}
            <span>💬 чат</span>
          </div>
        </div>

        {/* Футер */}
        <div className="studio-footer-note">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <span className="studio-signature-dynamic">
              ✍️ {room.title}
            </span>
          </div>
          {isCurrentUserLeader && status === 'ongoing' && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: 'var(--accent-primary)' }}>🎥 Вы ведёте раунд — управляйте видео</span>
            </div>
          )}
        </div>

        {/* Чат */}
        <div style={{ padding: '0 32px 22px 32px', borderTop: '1px dashed rgba(255,255,255,0.1)', marginTop: '0px', maxHeight: '300px', overflowY: 'auto' }}>
          <RoomChat
            messages={chatMessages}
            onSendMessage={sendMessage}
            currentUserId={currentUserId}
            slug={slug}
            roomId={roomId}
            isParticipant={effectiveIsParticipant}
            sendLoading={sendLoading}
          />
        </div>
        {/* Ошибки */}
        {error && (
          <div style={{ padding: '16px 32px', background: 'color-mix(in srgb, var(--accent-red) 15%, transparent)', borderTop: '1px solid color-mix(in srgb, var(--accent-red) 30%, transparent)', color: 'var(--accent-red)' }}>
            {error}
          </div>
        )}

        {/* Управление комнатой (для создателя и ведущего) */}
        {(isCreator && status !== 'finished') || (status === 'ongoing' && isCurrentUserLeader) ? (
          <div style={{ padding: '16px 32px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {isCreator && status === 'waiting' && (
              <button
                type="button"
                onClick={() => roomAction('start')}
                disabled={loading !== null}
                className="studio-ctrl-btn"
                style={{
                  background: 'color-mix(in srgb, var(--accent-green) 20%, transparent)',
                  border: '1px solid var(--accent-green)',
                  color: 'var(--accent-green)',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading === 'start' ? 'Запуск…' : 'Начать'}
              </button>
            )}
            {status === 'ongoing' && (isCreator || isCurrentUserLeader) && (
              <button
                type="button"
                onClick={() => roomAction('next_round')}
                disabled={loading !== null}
                className="studio-ctrl-btn special"
                style={{ opacity: loading ? 0.5 : 1 }}
              >
                {loading === 'next_round' ? '…' : 'Следующий раунд'}
              </button>
            )}
            {isCreator && (
              <button
                type="button"
                onClick={() => roomAction('finish')}
                disabled={loading !== null}
                className="studio-ctrl-btn end-call"
                style={{ opacity: loading ? 0.5 : 1 }}
              >
                {loading === 'finish' ? '…' : 'Завершить комнату'}
              </button>
            )}
          </div>
        ) : null}

        {/* Вход в комнату */}
        {!currentUserId && (
          <div style={{ padding: '16px 32px', borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
            <Link
              href={`/auth/signin?callbackUrl=${encodeURIComponent(`/universes/${slug}/rooms/${roomId}`)}`}
              style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}
            >
              Войдите
            </Link>
            , чтобы присоединиться к комнате.
          </div>
        )}
        {currentUserId && status !== 'finished' && !effectiveIsParticipant && (
          <div style={{ padding: '16px 32px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={join}
              disabled={loading !== null}
              className="studio-ctrl-btn"
              style={{
                background: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)',
                border: '1px solid var(--accent-primary)',
                color: 'var(--accent-primary)',
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading === 'join' ? 'Вход…' : 'Войти в комнату'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
