import { apiRequest } from '@/lib/api';

/** POST /api/universes/[slug]/mind-maps — create mind map (title required by API) */
export async function createMindMap(slug: string, payload: { title: string }) {
  const title = typeof payload.title === 'string' && payload.title.trim() ? payload.title.trim() : 'Новая карта';
  return apiRequest<{ id: string; title: string; universeId: string; [k: string]: unknown }>(
    `/api/universes/${encodeURIComponent(slug)}/mind-maps`,
    {
      method: 'POST',
      body: JSON.stringify({ title }),
    }
  );
}
