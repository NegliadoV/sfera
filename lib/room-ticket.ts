/**
 * Получает короткоживущий room ticket для авторизации WS join_room.
 * Ticket выдаётся только если пользователь является участником комнаты (проверка в БД).
 * Живёт 2 минуты — достаточно для подключения к WS.
 */
export async function fetchRoomTicket(roomId: string): Promise<string | null> {
  try {
    const res = await fetch('/api/spaces/room-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId }),
    });
    if (!res.ok) return null;
    const { ticket } = await res.json();
    return ticket ?? null;
  } catch {
    return null;
  }
}
