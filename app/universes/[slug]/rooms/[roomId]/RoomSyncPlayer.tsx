'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getYouTubeVideoId } from '@/lib/youtube';

export type PlaybackState = { currentTime?: number; playing?: boolean };

type ContentInfo = { type: string; url: string | null; title: string };

/** Как часто при воспроизведении шлём позицию остальным (влияет на то, как быстро видят перемотку) */
const SYNC_EMIT_INTERVAL_MS = 400;
const REMOTE_APPLY_GRACE_MS = 800;
/** Скачок времени больше этого (сек) считаем перемоткой — шлём состояние сразу */
const SEEK_JUMP_THRESHOLD_SEC = 1.2;

declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: { videoId: string; events?: { onReady?: (e: { target: YTPlayer }) => void; onStateChange?: (e: { data: number; target: YTPlayer }) => void } }) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  getCurrentTime(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
  getPlayerState(): number;
}

const YT_PLAYING = 1;
const YT_BUFFERING = 3;

export function RoomSyncPlayer({
  content,
  slug,
  contentId,
  playbackState,
  onPlaybackChange,
  isParticipant,
  canControl,
}: {
  content: ContentInfo;
  slug: string;
  contentId: string;
  playbackState: PlaybackState | null;
  onPlaybackChange: (state: PlaybackState) => void;
  isParticipant: boolean;
  /** Право управлять контентом (ведущий раунда); иначе только следование за другими */
  canControl: boolean;
}) {
  const [ytReady, setYtReady] = useState(false);
  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastEmitRef = useRef<{ t: number; p: boolean }>({ t: 0, p: false });
  const remoteApplyUntilRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Последнее состояние от других участников — применяем при готовности плеера, если оно пришло до onReady */
  const lastRemoteStateRef = useRef<PlaybackState | null>(null);
  const canControlRef = useRef(canControl);
  useEffect(() => {
    canControlRef.current = canControl;
  }, [canControl]);

  const videoId = content.url ? getYouTubeVideoId(content.url) : null;
  const isYouTube = !!videoId;

  const applyRemoteState = useCallback(
    (state: PlaybackState) => {
      if (!isParticipant) return;
      remoteApplyUntilRef.current = Date.now() + REMOTE_APPLY_GRACE_MS;
      const player = playerRef.current;
      if (isYouTube && player) {
        const t = state.currentTime;
        if (typeof t === 'number' && t >= 0) player.seekTo(t, true);
        if (state.playing === true) player.playVideo();
        else if (state.playing === false) player.pauseVideo();
      }
    },
    [isParticipant, isYouTube]
  );

  useEffect(() => {
    if (!playbackState || !isParticipant) return;
    lastRemoteStateRef.current = playbackState;
    applyRemoteState(playbackState);
  }, [playbackState, isParticipant, applyRemoteState]);

  const [ytApiReady, setYtApiReady] = useState(!!(typeof window !== 'undefined' && window.YT));

  useEffect(() => {
    if (!isYouTube || !videoId) return;
    if (window.YT?.Player) {
      const id = setTimeout(() => setYtApiReady(true), 0);
      return () => clearTimeout(id);
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript?.parentNode?.insertBefore(tag, firstScript);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      setYtApiReady(true);
    };
    return () => {
      window.onYouTubeIframeAPIReady = prev;
    };
  }, [videoId, isYouTube]);

  useEffect(() => {
    if (!isYouTube || !videoId || !ytApiReady || !containerRef.current || !window.YT?.Player) return;
    const el = containerRef.current;
    new window.YT.Player(el, {
      videoId,
      events: {
        onReady(ev: { target: YTPlayer }) {
          playerRef.current = ev.target;
          setYtReady(true);
          // Второй пользователь мог получить playback_state до готовности плеера — применяем сейчас
          const state = lastRemoteStateRef.current;
          if (state && isParticipant) {
            remoteApplyUntilRef.current = Date.now() + REMOTE_APPLY_GRACE_MS;
            const p = ev.target;
            const t = state.currentTime;
            if (typeof t === 'number' && t >= 0) p.seekTo(t, true);
            if (state.playing === true) p.playVideo();
            else if (state.playing === false) p.pauseVideo();
          }
        },
        onStateChange(ev: { data: number; target: YTPlayer }) {
          if (Date.now() < remoteApplyUntilRef.current) return;
          if (!canControlRef.current) return;
          const state = ev.data;
          const playing = state === YT_PLAYING;
          const t = ev.target.getCurrentTime?.() ?? 0;
          onPlaybackChange({ currentTime: t, playing });
          lastEmitRef.current = { t, p: playing };
          if (state === YT_BUFFERING) {
            onPlaybackChange({ currentTime: t });
          }
        },
      },
    });
    return () => {
      playerRef.current = null;
      setYtReady(false);
    };
  }, [videoId, isYouTube, ytApiReady, onPlaybackChange]);

  useEffect(() => {
    if (!isYouTube || !ytReady || !isParticipant) return;
    const id = setInterval(() => {
      if (!canControlRef.current) return;
      const player = playerRef.current;
      if (Date.now() < remoteApplyUntilRef.current || !player) return;
      const state = player.getPlayerState?.();
      const t = player.getCurrentTime?.() ?? 0;
      const last = lastEmitRef.current;
      const isPlaying = state === YT_PLAYING;
      const isSeek = Math.abs(t - last.t) > SEEK_JUMP_THRESHOLD_SEC;
      if (isSeek) {
        lastEmitRef.current = { t, p: isPlaying };
        onPlaybackChange({ currentTime: t, playing: isPlaying });
        return;
      }
      if (!isPlaying) return;
      if (Math.abs(t - last.t) < 0.3 && last.p) return;
      lastEmitRef.current = { t, p: true };
      onPlaybackChange({ currentTime: t, playing: true });
    }, SYNC_EMIT_INTERVAL_MS);
    intervalRef.current = id;
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isYouTube, ytReady, isParticipant, onPlaybackChange]);

  if (!content.url) {
    return (
      <section className="rounded-[var(--radius-lg)] border p-4" style={{ borderColor: 'var(--border-color)' }}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          <Link href={`/universes/${slug}/content/${contentId}`} className="underline" style={{ color: 'var(--accent-blue)' }}>
            Открыть материал: {content.title}
          </Link>
        </p>
      </section>
    );
  }

  if (isYouTube) {
    return (
      <section className="space-y-2">
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {canControl ? 'Вы ведёте раунд — управляйте видео' : 'Синхронный просмотр — повтор за ведущим'}
        </p>
        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
          {content.title}
        </p>
        {/* Внешний бокс 16:9; внутренний — с явными размерами для YouTube iframe */}
        <div
          className="relative w-full overflow-hidden rounded-[var(--radius-lg)] border bg-black"
          style={{ paddingBottom: '56.25%', borderColor: 'var(--border-color)' }}
        >
          <div
            ref={containerRef}
            className="absolute inset-0 w-full h-full"
          >
            {/* YouTube API создаёт iframe внутри containerRef */}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        Материал: <Link href={`/universes/${slug}/content/${contentId}`} className="underline" style={{ color: 'var(--accent-blue)' }}>{content.title}</Link>
      </p>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Синхронизация для не-YouTube контента в разработке. Откройте материал по ссылке выше.
      </p>
    </section>
  );
}
