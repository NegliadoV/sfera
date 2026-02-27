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
    <div className="flex flex-wrap gap-2 mt-3">
      {(Object.keys(REACTION_LABELS) as ReactionType[]).map((type) => {
        const count = counts[type] ?? 0;
        const isActive = myReaction === type;
        return (
          <button
            key={type}
            type="button"
            disabled={pending}
            onClick={() => setReaction(type)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-sm border-0 cursor-pointer transition-all duration-200 hover:scale-105 disabled:opacity-60"
            style={{
              backgroundColor: isActive ? 'var(--accent-primary)' : 'var(--bg-accent)',
              color: isActive ? 'white' : 'var(--text-secondary)',
            }}
          >
            <span>{REACTION_LABELS[type]}</span>
            {count > 0 && <span className="opacity-80">({count})</span>}
          </button>
        );
      })}
    </div>
  );
}
