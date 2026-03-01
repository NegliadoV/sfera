import { apiRequest } from '@/lib/api';

/** POST /api/parse-telegram — parse Telegram URL for title/description */
export async function parseTelegram(url: string): Promise<{ title?: string; description?: string; url?: string }> {
  return apiRequest<{ title?: string; description?: string; url?: string }>('/api/parse-telegram', {
    method: 'POST',
    body: JSON.stringify({ url: url.trim() }),
    skipAuth: true,
  });
}

export type CreateContentPayload = {
  universeId: string;
  type?: 'link' | 'article' | 'text' | 'video' | 'podcast';
  title: string;
  url?: string;
  body?: string;
};

/** POST /api/content — create content (body as in AddContentForm) */
export async function createContent(payload: CreateContentPayload) {
  return apiRequest<{ id: string; title: string; universeId: string; [k: string]: unknown }>('/api/content', {
    method: 'POST',
    body: JSON.stringify({
      universeId: payload.universeId,
      type: payload.type ?? 'link',
      title: payload.title.trim(),
      url: payload.url?.trim() || undefined,
      body: payload.body?.trim() || undefined,
    }),
  });
}

/** POST /api/me/content/share — share user content to universe (userContentId from me/content) */
export async function shareContentToUniverse(userContentId: string, universeId: string) {
  return apiRequest<{ ok?: boolean }>('/api/me/content/share', {
    method: 'POST',
    body: JSON.stringify({ userContentId, universeId }),
  });
}

export type CommentItem = {
  id: string;
  contentId: string;
  authorId: string;
  authorName?: string | null;
  parentId?: string | null;
  type?: string;
  body: string;
  createdAt?: string;
};

/** GET /api/content/[contentId]/comments */
export async function getComments(contentId: string): Promise<CommentItem[]> {
  const data = await apiRequest<CommentItem[]>(
    `/api/content/${encodeURIComponent(contentId)}/comments`
  );
  return Array.isArray(data) ? data : [];
}

/** POST /api/content/[contentId]/comments */
export async function postComment(
  contentId: string,
  payload: { body: string; parentId?: string | null; type?: string }
): Promise<CommentItem> {
  return apiRequest<CommentItem>(`/api/content/${encodeURIComponent(contentId)}/comments`, {
    method: 'POST',
    body: JSON.stringify({
      body: payload.body.trim(),
      parentId: payload.parentId ?? undefined,
      type: payload.type ?? 'thesis',
    }),
  });
}
