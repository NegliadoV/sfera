import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { roomParticipants } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { createRoomTicket } from '@/lib/ws-token';

/**
 * POST /api/spaces/room-ticket
 * Тело: { roomId: string }
 *
 * Выдаёт короткоживущий (2 мин) подписанный тикет для входа в WS-комнату.
 * Проверяет, что текущий пользователь является участником комнаты в БД.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId } = await req.json();
    if (!roomId || typeof roomId !== 'string') {
      return NextResponse.json({ error: 'roomId обязателен' }, { status: 400 });
    }

    // Проверяем, что пользователь является участником комнаты
    const [participant] = await db
      .select({ roomId: roomParticipants.roomId })
      .from(roomParticipants)
      .where(
        and(
          eq(roomParticipants.roomId, roomId),
          eq(roomParticipants.userId, session.user.id)
        )
      )
      .limit(1);

    if (!participant) {
      return NextResponse.json({ error: 'Доступ запрещён: вы не участник этой комнаты' }, { status: 403 });
    }

    const ticket = createRoomTicket(session.user.id, roomId);
    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('[room-ticket] error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
