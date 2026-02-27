import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, universes, rooms, roomRounds, roomParticipants, user, themes } from '@/lib/db';
import { eq, and, asc } from 'drizzle-orm';
import { notifyRoom } from '@/lib/room-notify';

export const dynamic = 'force-dynamic';

/** GET /api/universes/[slug]/rooms/[roomId] — одна комната с раундами и участниками */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; roomId: string }> }
) {
  const { slug, roomId } = await params;
  try {
    const [u] = await db.select().from(universes).where(eq(universes.slug, slug)).limit(1);
    if (!u) return NextResponse.json({ error: 'Universe not found' }, { status: 404 });

    const [roomRow] = await db
      .select({
        id: rooms.id,
        universeId: rooms.universeId,
        themeId: rooms.themeId,
        themeName: themes.name,
        contentId: rooms.contentId,
        title: rooms.title,
        status: rooms.status,
        timeLimitMinutes: rooms.timeLimitMinutes,
        createdById: rooms.createdById,
        currentRoundIndex: rooms.currentRoundIndex,
        startedAt: rooms.startedAt,
        finishedAt: rooms.finishedAt,
        createdAt: rooms.createdAt,
        updatedAt: rooms.updatedAt,
      })
      .from(rooms)
      .leftJoin(themes, eq(rooms.themeId, themes.id))
      .where(and(eq(rooms.id, roomId), eq(rooms.universeId, u.id)))
      .limit(1);
    if (!roomRow) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    const room = { ...roomRow, themeName: roomRow.themeName ?? null };

    const [rounds, participants] = await Promise.all([
      db
        .select()
        .from(roomRounds)
        .where(eq(roomRounds.roomId, room.id))
        .orderBy(asc(roomRounds.orderIndex)),
      db
        .select({
          userId: roomParticipants.userId,
          joinedAt: roomParticipants.joinedAt,
          userName: user.name,
        })
        .from(roomParticipants)
        .leftJoin(user, eq(roomParticipants.userId, user.id))
        .where(eq(roomParticipants.roomId, room.id))
        .orderBy(asc(roomParticipants.joinedAt)),
    ]);

    const { themeName, ...roomData } = room;
    return NextResponse.json({
      ...roomData,
      themeName: themeName ?? null,
      rounds,
      participants,
    });
  } catch (e) {
    console.error('GET /api/universes/[slug]/rooms/[roomId]', e);
    return NextResponse.json({ error: 'Failed to load room' }, { status: 500 });
  }
}

/** PATCH /api/universes/[slug]/rooms/[roomId] — старт / следующий раунд / завершение (создатель) */
export async function PATCH(
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

    const body = await req.json().catch(() => ({}));
    const { action } = body as { action?: 'start' | 'next_round' | 'finish' };

    const isCreator = room.createdById === session.user.id;

    if (action === 'next_round') {
      const [participant] = await db
        .select({ userId: roomParticipants.userId })
        .from(roomParticipants)
        .where(and(eq(roomParticipants.roomId, room.id), eq(roomParticipants.userId, session.user.id)))
        .limit(1);
      const isParticipant = !!participant;
      if (!isCreator && !isParticipant) {
        return NextResponse.json({ error: 'Только создатель комнаты или участник (ведущий раунда) может передать раунд' }, { status: 403 });
      }
    } else {
      if (!isCreator) {
        return NextResponse.json({ error: 'Only room creator can control the room' }, { status: 403 });
      }
    }

    if (action === 'start') {
      if (room.status !== 'waiting') {
        return NextResponse.json({ error: 'Room already started' }, { status: 400 });
      }
      const [updated] = await db
        .update(rooms)
        .set({
          status: 'ongoing',
          startedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(rooms.id, room.id))
        .returning();
      if (updated) await notifyRoom(room.id, 'room_state_updated', { status: updated.status, currentRoundIndex: updated.currentRoundIndex });
      return NextResponse.json(updated);
    }

    if (action === 'next_round') {
      if (room.status !== 'ongoing') {
        return NextResponse.json({ error: 'Room is not ongoing' }, { status: 400 });
      }
      const [updated] = await db
        .update(rooms)
        .set({
          currentRoundIndex: room.currentRoundIndex + 1,
          updatedAt: new Date(),
        })
        .where(eq(rooms.id, room.id))
        .returning();
      if (updated) await notifyRoom(room.id, 'room_state_updated', { status: updated.status, currentRoundIndex: updated.currentRoundIndex });
      return NextResponse.json(updated);
    }

    if (action === 'finish') {
      const [updated] = await db
        .update(rooms)
        .set({
          status: 'finished',
          finishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(rooms.id, room.id))
        .returning();
      if (updated) await notifyRoom(room.id, 'room_state_updated', { status: updated.status, currentRoundIndex: updated.currentRoundIndex });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    console.error('PATCH /api/universes/[slug]/rooms/[roomId]', e);
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}
