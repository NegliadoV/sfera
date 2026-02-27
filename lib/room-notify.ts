/**
 * Вызов notify-эндпоинта WS-сервера для рассылки событий в комнату.
 * Используется из API-маршрутов после join/leave/PATCH комнаты.
 */
const WS_SERVER_URL = process.env.WS_SERVER_URL ?? 'http://localhost:3002';

export type RoomNotifyEvent =
  | 'participants_updated'
  | 'room_state_updated'
  | 'room_chat_message';

export interface ParticipantsUpdatedPayload {
  participants: Array<{ userId: string; userName: string | null; joinedAt: string }>;
}

export interface RoomStateUpdatedPayload {
  status?: string;
  currentRoundIndex?: number;
}

export interface RoomChatMessagePayload {
  id: string;
  userId: string;
  userName: string | null;
  body: string;
  createdAt: string;
}

/** Отправить событие в комнату (вызывается с сервера после изменения в БД). */
export async function notifyRoom(
  roomId: string,
  event: RoomNotifyEvent,
  data: ParticipantsUpdatedPayload | RoomStateUpdatedPayload | RoomChatMessagePayload
): Promise<void> {
  try {
    const res = await fetch(`${WS_SERVER_URL}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, event, data }),
    });
    if (!res.ok) {
      console.warn('[room-notify] Notify failed:', res.status, await res.text());
    }
  } catch (e) {
    console.warn('[room-notify] Notify error (is ws-server running?):', e);
  }
}
