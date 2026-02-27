'use client';

import { useEffect, useState, useCallback } from 'react';
import { ReactionButtons } from '@/components/ReactionButtons';

type Props = { commentId: string; onUpdate?: () => void };

export function CommentReactions({ commentId, onUpdate }: Props) {
  const [data, setData] = useState<{ counts: Record<string, number>; myReaction: string | null } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/reactions?targetType=comment&targetId=${commentId}`, {
      credentials: 'include',
    });
    if (res.ok) {
      const j = await res.json();
      setData({ counts: j.counts ?? {}, myReaction: j.myReaction ?? null });
    }
  }, [commentId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/reactions?targetType=comment&targetId=${commentId}`, {
        credentials: 'include',
      });
      if (cancelled) return;
      if (res.ok) {
        const j = await res.json();
        setData({ counts: j.counts ?? {}, myReaction: j.myReaction ?? null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [commentId]);

  if (!data) return <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>…</span>;
  return (
    <ReactionButtons
      targetType="comment"
      targetId={commentId}
      counts={data.counts}
      myReaction={data.myReaction}
      onUpdate={() => {
        load();
        onUpdate?.();
      }}
    />
  );
}
