'use client';

import { useTransition } from 'react';
import { REACTION_LABELS, type ReactionType } from '@/lib/reactions';

type Props = {
  targetType: 'content' | 'comment';
  targetId: string;
  counts: Record<string, number>;
  myReaction: string | null;
  onUpdate?: () => void;
};

export function ReactionButtons({ targetType, targetId, counts, myReaction, onUpdate }: Props) {
  const [pending, startTransition] = useTransition();

  const setReaction = (reactionType: ReactionType) => {
    startTransition(async () => {
      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetType, targetId, reactionType }),
      });
      onUpdate?.();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      {(Object.keys(REACTION_LABELS) as ReactionType[]).map((type) => {
        const count = counts[type] ?? 0;
        const isActive = myReaction === type;
        return (
          <button
            key={type}
            type="button"
            disabled={pending}
            onClick={() => setReaction(type)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 active:scale-95 disabled:opacity-60 cursor-pointer select-none ${
              isActive
                ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-[0_2px_12px_color-mix(in_srgb,var(--accent-primary)_40%,transparent)] scale-105'
                : 'bg-white/5 text-[var(--text-secondary)] border-white/10 hover:border-white/20 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="text-sm leading-none">{REACTION_LABELS[type]}</span>
            {count > 0 && (
              <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-[var(--text-secondary)]'}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
