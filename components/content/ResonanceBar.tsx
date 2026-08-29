'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '@/components/i18n/LanguageProvider';

export type ResonanceType = 'insight' | 'ignite' | 'ponder' | 'resonate' | 'inspire' | 'challenge';

const REACTION_EMOJIS: Record<ResonanceType, string> = {
  insight: '💡',
  ignite: '🔥',
  ponder: '🤔',
  resonate: '❤️',
  inspire: '🚀',
  challenge: '🧊',
};

const REACTION_COLORS: Record<ResonanceType, { color: string; glow: string }> = {
  insight:   { color: '#facc15', glow: 'rgba(250,204,21,0.35)' },
  ignite:    { color: '#f97316', glow: 'rgba(249,115,22,0.35)' },
  ponder:    { color: '#a78bfa', glow: 'rgba(167,139,250,0.35)' },
  resonate:  { color: '#f43f5e', glow: 'rgba(244,63,94,0.35)' },
  inspire:   { color: '#22d3ee', glow: 'rgba(34,211,238,0.35)' },
  challenge: { color: '#94a3b8', glow: 'rgba(148,163,184,0.35)' },
};

const REACTION_TYPES: ResonanceType[] = ['insight', 'ignite', 'ponder', 'resonate', 'inspire', 'challenge'];

const CSS_KEYFRAMES = `
  @keyframes resonanceBurst {
    0%   { opacity: 1;   transform: translateX(-50%) translateY(0px)   scale(0.8); filter: blur(0px); }
    40%  { opacity: 1;   transform: translateX(-50%) translateY(-20px)  scale(1.6); filter: blur(0px); }
    100% { opacity: 0;   transform: translateX(-50%) translateY(-52px)  scale(2.2); filter: blur(2px); }
  }
  @keyframes resonanceRipple {
    0%   { transform: scale(0.85); opacity: 0.6; }
    60%  { transform: scale(1.18); opacity: 0.15; }
    100% { transform: scale(1.45); opacity: 0; }
  }
  @keyframes resonancePop {
    0%   { transform: scale(1.08); }
    35%  { transform: scale(1.22); }
    60%  { transform: scale(0.95); }
    80%  { transform: scale(1.07); }
    100% { transform: scale(1.08); }
  }
  @keyframes resonanceCountIn {
    0%   { transform: translateY(6px) scale(0.7); opacity: 0; }
    100% { transform: translateY(0px) scale(1);   opacity: 1; }
  }
`;

interface ResonanceBarProps {
  contentId: string;
  isLoggedIn: boolean;
}

export function ResonanceBar({ contentId, isLoggedIn }: ResonanceBarProps) {
  const { t } = useTranslation();

  const RESONANCES = [
    { type: 'insight'   as ResonanceType, label: t('content.resonanceInsight',   'Озарение') },
    { type: 'ignite'    as ResonanceType, label: t('content.resonanceIgnite',    'Важно') },
    { type: 'ponder'    as ResonanceType, label: t('content.resonancePonder',    'Задуматься') },
    { type: 'resonate'  as ResonanceType, label: t('content.resonanceResonate',  'Отклик') },
    { type: 'inspire'   as ResonanceType, label: t('content.resonanceInspire',   'Вдохновляет') },
    { type: 'challenge' as ResonanceType, label: t('content.resonanceChallenge', 'Спорно') },
  ];

  const [counts, setCounts] = useState<Record<ResonanceType, number>>({
    insight: 0, ignite: 0, ponder: 0, resonate: 0, inspire: 0, challenge: 0,
  });
  const [userChoice, setUserChoice] = useState<ResonanceType | null>(null);
  const [prevChoice, setPrevChoice] = useState<ResonanceType | null>(null);
  const [loading, setLoading] = useState(true);
  const [burst, setBurst] = useState<{ type: ResonanceType; id: number } | null>(null);
  const [ripple, setRipple] = useState<{ type: ResonanceType; id: number } | null>(null);
  const fetchingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/content/${contentId}/resonances`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setCounts((prev) => ({ ...prev, ...data.counts }));
        setUserChoice(data.userChoice ?? null);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [contentId]);

  const handleClick = useCallback(
    async (type: ResonanceType) => {
      if (!isLoggedIn || fetchingRef.current) return;

      const prevChoiceSnap = userChoice;
      const prevCountsSnap = { ...counts };

      if (userChoice === type) {
        setUserChoice(null);
        setPrevChoice(null);
        setCounts((c) => ({ ...c, [type]: Math.max(0, c[type] - 1) }));
      } else {
        setPrevChoice(userChoice);
        setUserChoice(type);
        if (userChoice) setCounts((c) => ({ ...c, [userChoice]: Math.max(0, c[userChoice] - 1) }));
        setCounts((c) => ({ ...c, [type]: (c[type] || 0) + 1 }));
        const id = Date.now();
        setBurst({ type, id });
        setRipple({ type, id });
        setTimeout(() => setBurst(null), 900);
        setTimeout(() => setRipple(null), 600);
      }

      fetchingRef.current = true;
      try {
        await fetch(`/api/content/${contentId}/resonances`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type }),
          credentials: 'include',
        });
      } catch {
        setUserChoice(prevChoiceSnap);
        setCounts(prevCountsSnap);
      } finally {
        fetchingRef.current = false;
      }
    },
    [contentId, userChoice, counts, isLoggedIn]
  );

  const totalResonances = Object.values(counts).reduce((a, b) => a + b, 0);
  const chosenResonance = userChoice
    ? { ...RESONANCES.find((r) => r.type === userChoice)!, ...REACTION_COLORS[userChoice] }
    : null;

  return (
    <div className="w-full flex flex-col gap-3 pt-4 border-t border-white/10">
      <style dangerouslySetInnerHTML={{ __html: CSS_KEYFRAMES }} />

      {/* Header */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-white/80">
          {t('content.resonance', 'Резонанс')}
        </span>
        {totalResonances > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono" style={{ transition: 'opacity 0.3s ease' }}>
            {totalResonances}
          </span>
        )}
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full overflow-hidden"
          style={{
            backgroundColor: chosenResonance ? `${chosenResonance.color}22` : 'transparent',
            color: chosenResonance ? chosenResonance.color : 'transparent',
            border: `1px solid ${chosenResonance ? chosenResonance.color + '44' : 'transparent'}`,
            maxWidth: chosenResonance ? '140px' : '0px',
            opacity: chosenResonance ? 1 : 0,
            transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
            whiteSpace: 'nowrap',
          }}
        >
          {chosenResonance ? `${t('content.resonanceYou', 'Вы')}: ${chosenResonance.label}` : ''}
        </span>

        {!isLoggedIn && (
          <span className="text-[10px] text-white/30 ml-auto">
            {t('content.resonanceLogin', 'Войдите чтобы реагировать')}
          </span>
        )}
      </div>

      {/* Reaction story bar */}
      <div className="flex items-center gap-2 flex-wrap relative">
        {loading ? (
          REACTION_TYPES.map((_, i) => (
            <div
              key={i}
              className="h-8 rounded-2xl bg-white/5"
              style={{ width: `${68 + (i % 3) * 10}px`, animation: `pulse 1.6s ease-in-out ${i * 0.08}s infinite` }}
            />
          ))
        ) : (
          RESONANCES.map((r) => {
            const isActive = userChoice === r.type;
            const { color, glow } = REACTION_COLORS[r.type];
            const count = counts[r.type] || 0;
            const isRippling = ripple?.type === r.type;

            return (
              <button
                key={r.type}
                type="button"
                onClick={() => handleClick(r.type)}
                disabled={!isLoggedIn}
                title={r.label}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold select-none overflow-hidden"
                style={{
                  backgroundColor: isActive ? `${color}1e` : 'rgba(255,255,255,0.05)',
                  color: isActive ? color : 'rgba(255,255,255,0.6)',
                  border: `1.5px solid ${isActive ? color + 'cc' : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: isActive ? `0 0 0 1px ${color}44, 0 0 18px ${glow}, 0 0 6px ${glow}` : 'none',
                  cursor: isLoggedIn ? 'pointer' : 'default',
                  opacity: isLoggedIn ? 1 : 0.55,
                  transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  animation: isActive && prevChoice !== r.type ? 'resonancePop 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards' : undefined,
                  transition: [
                    'background-color 0.3s cubic-bezier(0.4,0,0.2,1)',
                    'color 0.3s cubic-bezier(0.4,0,0.2,1)',
                    'border-color 0.3s cubic-bezier(0.4,0,0.2,1)',
                    'box-shadow 0.4s cubic-bezier(0.4,0,0.2,1)',
                    'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                  ].join(', '),
                }}
              >
                {/* Ripple ring */}
                {isRippling && (
                  <span
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{ border: `2px solid ${color}`, animation: 'resonanceRipple 0.55s cubic-bezier(0.2,0.8,0.4,1) forwards' }}
                  />
                )}
                {/* Emoji */}
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '0.9rem',
                    lineHeight: 1,
                    transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                    transform: isActive ? 'scale(1.2) rotate(-8deg)' : 'scale(1) rotate(0deg)',
                  }}
                >
                  {REACTION_EMOJIS[r.type]}
                </span>
                {/* Label */}
                <span>{r.label}</span>
                {/* Count */}
                {count > 0 && (
                  <span
                    className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums min-w-[18px] text-center"
                    style={{
                      backgroundColor: isActive ? color : 'rgba(255,255,255,0.12)',
                      color: isActive ? '#000' : 'rgba(255,255,255,0.8)',
                      transition: 'background-color 0.3s ease, color 0.3s ease',
                      animation: 'resonanceCountIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })
        )}

        {/* Floating emoji burst */}
        {burst && (() => {
          const { color, glow } = REACTION_COLORS[burst.type];
          return (
            <div
              key={burst.id}
              className="absolute pointer-events-none"
              style={{
                fontSize: '2rem',
                bottom: '110%',
                left: '50%',
                animation: 'resonanceBurst 0.85s cubic-bezier(0.2,0.8,0.4,1) forwards',
                zIndex: 50,
                filter: `drop-shadow(0 0 12px ${glow})`,
                lineHeight: 1,
              }}
            >
              {REACTION_EMOJIS[burst.type]}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
