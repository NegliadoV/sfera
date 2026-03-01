import { apiRequest } from '@/lib/api';

export type CreateRoomPayload = {
  title: string;
  themeId?: string | null;
  contentId?: string | null;
  timeLimitMinutes?: number | null;
};

/** POST /api/universes/[slug]/rooms — create room */
export async function createRoom(slug: string, payload: CreateRoomPayload) {
  return apiRequest<{ id: string; title: string; universeId: string; [k: string]: unknown }>(
    `/api/universes/${encodeURIComponent(slug)}/rooms`,
    {
      method: 'POST',
      body: JSON.stringify({
        title: payload.title.trim(),
        themeId: payload.themeId ?? undefined,
        contentId: payload.contentId ?? undefined,
        timeLimitMinutes: payload.timeLimitMinutes ?? undefined,
      }),
    }
  );
}

/** POST /api/universes/[slug]/rooms/[roomId]/join — join room */
export async function joinRoom(slug: string, roomId: string) {
  return apiRequest<{ ok?: boolean }>(
    `/api/universes/${encodeURIComponent(slug)}/rooms/${encodeURIComponent(roomId)}/join`,
    { method: 'POST' }
  );
}
