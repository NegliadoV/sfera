'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from 'next-auth';

export type DigestDelivery = 'none' | 'in_app' | 'email';

export interface HygieneState {
  focusMode: boolean;
  dailyTimeLimitMinutes: number | null;
  digestDelivery: DigestDelivery;
}

const defaultState: HygieneState = {
  focusMode: false,
  dailyTimeLimitMinutes: null,
  digestDelivery: 'none',
};

const HygieneContext = createContext<{
  hygiene: HygieneState;
  loading: boolean;
  setHygiene: (patch: Partial<HygieneState>) => Promise<void>;
  refetch: () => Promise<void>;
}>({
  hygiene: defaultState,
  loading: false,
  setHygiene: async () => {},
  refetch: async () => {},
});

export function useHygiene() {
  const ctx = useContext(HygieneContext);
  return ctx;
}

export function HygieneProvider({
  session,
  children,
}: {
  session: Session | null;
  children: ReactNode;
}) {
  const [hygiene, setHygieneState] = useState<HygieneState>(defaultState);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!session?.user?.id) {
      setHygieneState(defaultState);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/me/hygiene', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setHygieneState({
          focusMode: !!data.focusMode,
          dailyTimeLimitMinutes:
            data.dailyTimeLimitMinutes != null ? Number(data.dailyTimeLimitMinutes) : null,
          digestDelivery: data.digestDelivery === 'email' || data.digestDelivery === 'in_app' ? data.digestDelivery : 'none',
        });
      }
    } catch {
      // keep default
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const setHygiene = useCallback(
    async (patch: Partial<HygieneState>) => {
      if (!session?.user?.id) return;
      try {
        const res = await fetch('/api/me/hygiene', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(patch),
        });
        if (res.ok) {
          const data = await res.json();
          setHygieneState({
            focusMode: !!data.focusMode,
            dailyTimeLimitMinutes:
              data.dailyTimeLimitMinutes != null ? Number(data.dailyTimeLimitMinutes) : null,
            digestDelivery: data.digestDelivery === 'email' || data.digestDelivery === 'in_app' ? data.digestDelivery : 'none',
          });
        }
      } catch {
        // ignore
      }
    },
    [session?.user?.id]
  );

  const value = {
    hygiene,
    loading,
    setHygiene,
    refetch,
  };

  return <HygieneContext.Provider value={value}>{children}</HygieneContext.Provider>;
}
