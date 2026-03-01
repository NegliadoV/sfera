import { apiRequest } from '@/lib/api';
import type { Universe } from '@/types/api';

export async function fetchUniverses(): Promise<Universe[]> {
  const data = await apiRequest<Universe[] | { universes?: Universe[] }>('/api/universes');
  if (Array.isArray(data)) return data;
  return data.universes ?? [];
}

export async function fetchMyUniverses(): Promise<Universe[]> {
  try {
    const data = await apiRequest<Universe[] | { universes?: Universe[] }>('/api/me/universes');
    if (Array.isArray(data)) return data;
    return data.universes ?? [];
  } catch {
    return [];
  }
}

export async function fetchUniverseBySlug(slug: string) {
  return apiRequest<Universe>(`/api/universes/${encodeURIComponent(slug)}`);
}

/** GET /api/universes/[slug]/track → { tracking: boolean } */
export async function getTracking(slug: string): Promise<{ tracking: boolean }> {
  const data = await apiRequest<{ tracking?: boolean }>(
    `/api/universes/${encodeURIComponent(slug)}/track`
  );
  return { tracking: data.tracking ?? false };
}

/** POST /api/universes/[slug]/track — toggle (returns { tracking: boolean }) */
export async function trackUniverse(slug: string): Promise<{ tracking: boolean }> {
  const data = await apiRequest<{ tracking?: boolean }>(
    `/api/universes/${encodeURIComponent(slug)}/track`,
    { method: 'POST' }
  );
  return { tracking: data.tracking ?? true };
}

/** DELETE /api/universes/[slug]/track — unsubscribe */
export async function untrackUniverse(slug: string): Promise<{ tracking: boolean }> {
  await apiRequest(`/api/universes/${encodeURIComponent(slug)}/track`, { method: 'DELETE' });
  return { tracking: false };
}

export type CreateUniversePayload = {
  name: string;
  description?: string;
  slug?: string;
  icon?: string;
};

/** POST /api/universes — create universe (body as in CreateUniverseForm) */
export async function createUniverse(payload: CreateUniversePayload): Promise<Universe & { slug: string }> {
  const slug =
    (payload.slug && payload.slug.trim()) ||
    payload.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const body = {
    slug,
    name: payload.name.trim(),
    description: payload.description?.trim() || undefined,
    icon: payload.icon?.trim() ? (payload.icon.trim().startsWith('fa-') ? payload.icon.trim() : `fa-${payload.icon.trim()}`) : undefined,
  };
  const data = await apiRequest<Universe & { slug: string }>('/api/universes', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return data;
}
