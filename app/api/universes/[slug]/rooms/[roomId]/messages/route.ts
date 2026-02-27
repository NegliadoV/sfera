import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, universes, rooms, roomChatMessages, roomParticipants, user } from '@/lib/db';
import { eq, and, asc } from 'drizzle-orm';
import { notifyRoom } from '@/lib/room-notify';
import type { RoomChatMessagePayload } from '@/lib/room-notify';

export const dynamic = 'force-dynamic';

/** GET /api/universes/[slug]/rooms/[roomId]/messages — история чата комнаты */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; roomId: string }> }
) {
  const { slug, roomId } = await params;
  try {
    const [u] = await db.select().from(universes).where(eq(universes.slug, slug)).limit(1);
    if (!u) return NextResponse.json({ error: 'Universe not found' }, { status: 404 });

    const [room] = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.id, roomId), eq(rooms.universeId, u.id)))
      .limit(1);
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    const rows = await db
      .select({
        id: roomChatMessages.id,
        userId: roomChatMessages.userId,
        userName: user.name,
        body: roomChatMessages.body,
        createdAt: roomChatMessages.createdAt,
      })
      .from(roomChatMessages)
      .leftJoin(user, eq(roomChatMessages.userId, user.id))
      .where(eq(roomChatMessages.roomId, roomId))
      .orderBy(asc(roomChatMessages.createdAt));

    const messages = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.userName ?? null,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
    }));
    return NextResponse.json(messages);
  } catch (e) {
    console.error('GET /api/universes/[slug]/rooms/[roomId]/messages', e);
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }
}

/** POST /api/universes/[slug]/rooms/[roomId]/messages — отправить сообщение (только участник) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; roomId: string }> }
) {
  const { slug, roomId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [u] = await db.select().from(universes).where(eq(universes.slug, slug)).limit(1);
    if (!u) return NextResponse.json({ error: 'Universe not found' }, { status: 404 });

    const [room] = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.id, roomId), eq(rooms.universeId, u.id)))
      .limit(1);
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    const [participant] = await db
      .select()
      .from(roomParticipants)
      .where(and(eq(roomParticipants.roomId, roomId), eq(roomParticipants.userId, session.user.id)))
      .limit(1);
    if (!participant) {
      return NextResponse.json({ error: 'Only room participants can send messages' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { body: messageBody } = body as { body?: string };
    const trimmed = typeof messageBody === 'string' ? messageBody.trim() : '';
    if (!trimmed) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 });
    }

    const [inserted] = await db
      .insert(roomChatMessages)
      .values({
        roomId,
        userId: session.user.id,
        body: trimmed,
      })
      .returning();
    if (!inserted) return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });

    const payload: RoomChatMessagePayload = {
      id: inserted.id,
      userId: inserted.userId,
      userName: session.user.name ?? null,
      body: inserted.body,
      createdAt: inserted.createdAt.toISOString(),
    };
    await notifyRoom(roomId, 'room_chat_message', payload);

    return NextResponse.json(payload);
  } catch (e) {
    console.error('POST /api/universes/[slug]/rooms/[roomId]/messages', e);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
