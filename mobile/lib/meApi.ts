import { apiRequest } from '@/lib/api';
import type { ContentItem, DigestItem } from '@/types/api';

export async function fetchMyContent() {
  const data = await apiRequest<ContentItem[] | { items?: ContentItem[] }>('/api/me/content');
  if (Array.isArray(data)) return data;
  return data.items ?? [];
}

export async function fetchDigest() {
  const data = await apiRequest<DigestItem[] | { items?: DigestItem[] }>('/api/me/digest');
  if (Array.isArray(data)) return data;
  return data.items ?? [];
}

/** GET /api/me/user-tag */
export async function getUserTag(): Promise<string | null> {
  const data = await apiRequest<{ userTag?: string | null }>('/api/me/user-tag');
  return data.userTag ?? null;
}

/** PATCH /api/me/user-tag */
export async function updateUserTag(tag: string): Promise<string | null> {
  const data = await apiRequest<{ userTag?: string | null }>('/api/me/user-tag', {
    method: 'PATCH',
    body: JSON.stringify({ userTag: tag.trim().replace(/^@+/, '') }),
  });
  return data.userTag ?? null;
}
