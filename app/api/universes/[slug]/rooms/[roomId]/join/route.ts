import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, universes, rooms, roomParticipants, user } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { notifyRoom } from '@/lib/room-notify';

export const dynamic = 'force-dynamic';

/** POST /api/universes/[slug]/rooms/[roomId]/join — войти в комнату */
export async function POST(
  _req: Request,
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

    await db
      .insert(roomParticipants)
      .values({ roomId: room.id, userId: session.user.id })
      .onConflictDoNothing({ target: [roomParticipants.roomId, roomParticipants.userId] });

    const participants = await db
      .select({
        userId: roomParticipants.userId,
        joinedAt: roomParticipants.joinedAt,
        userName: user.name,
      })
      .from(roomParticipants)
      .leftJoin(user, eq(roomParticipants.userId, user.id))
      .where(eq(roomParticipants.roomId, room.id));
    await notifyRoom(room.id, 'participants_updated', {
      participants: participants.map((p) => ({
        userId: p.userId,
        userName: p.userName ?? null,
        joinedAt: p.joinedAt.toISOString(),
      })),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/universes/[slug]/rooms/[roomId]/join', e);
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }
}
