import { apiRequest } from '@/lib/api';

export const REACTION_TYPES = ['confirm_source', 'please_clarify', 'important_counterargument'] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

export type ReactionsResponse = {
  counts: Record<string, number>;
  myReaction: string | null;
};

/** GET /api/reactions?targetType=&targetId= */
export async function getReactions(
  targetType: 'content' | 'comment',
  targetId: string
): Promise<ReactionsResponse> {
  const data = await apiRequest<{ counts?: Record<string, number>; myReaction?: string | null }>(
    `/api/reactions?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`
  );
  return {
    counts: data.counts ?? {},
    myReaction: data.myReaction ?? null,
  };
}

/** POST /api/reactions — set reaction (body: targetType, targetId, reactionType) */
export async function setReaction(
  targetType: 'content' | 'comment',
  targetId: string,
  reactionType: ReactionType
): Promise<void> {
  await apiRequest('/api/reactions', {
    method: 'POST',
    body: JSON.stringify({ targetType, targetId, reactionType }),
  });
}
