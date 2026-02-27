'use client';

import { useEffect, useRef, useState } from 'react';
import { useHygiene } from '@/components/HygieneProvider';

const STORAGE_KEY_PREFIX = 'hygiene-time-';

function getTodayKey() {
  const d = new Date();
  return `${STORAGE_KEY_PREFIX}${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getStoredMinutes(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const v = localStorage.getItem(getTodayKey());
    return v != null ? Math.max(0, Math.floor(Number(v))) : 0;
  } catch {
    return 0;
  }
}

function addStoredMinutes(deltaMs: number) {
  if (typeof window === 'undefined') return;
  try {
    const key = getTodayKey();
    const prev = getStoredMinutes();
    const added = Math.floor(deltaMs / 60_000);
    localStorage.setItem(key, String(prev + added));
  } catch {
    // ignore
  }
}

export function SessionTimer() {
  const { hygiene } = useHygiene();
  const [minutesToday, setMinutesToday] = useState(0);
  const [now, setNow] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    const t = Date.now();
    startedAtRef.current = t;
    const id = setTimeout(() => {
      setMinutesToday(getStoredMinutes());
      setStartedAt(t);
      setNow(t);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        const start = startedAtRef.current;
        if (start != null) {
          addStoredMinutes(Date.now() - start);
          setMinutesToday(getStoredMinutes());
        }
        startedAtRef.current = null;
        setStartedAt(null);
      } else {
        const t = Date.now();
        startedAtRef.current = t;
        setStartedAt(t);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    const interval = setInterval(() => {
      setMinutesToday(getStoredMinutes());
      setNow(Date.now());
    }, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, []);

  const limit = hygiene.dailyTimeLimitMinutes;
  if (limit == null || limit <= 0) return null;

  const currentSessionMinutes = startedAt != null && now > 0 ? Math.floor((now - startedAt) / 60_000) : 0;
  const total = minutesToday + currentSessionMinutes;
  const isOver = total >= limit;

  return (
    <span
      className="text-xs px-2 py-1 rounded-full"
      style={{
        backgroundColor: isOver ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-accent)',
        color: isOver ? 'var(--accent-red)' : 'var(--text-secondary)',
      }}
      title="Время сегодня (по вкладке)"
    >
      {total} / {limit} мин
    </span>
  );
}
