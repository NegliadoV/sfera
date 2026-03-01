import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, universes, rooms, roomRounds, roomParticipants, user, themes } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** GET /api/universes/[slug]/rooms — список комнат вселенной */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const [u] = await db.select().from(universes).where(eq(universes.slug, slug)).limit(1);
    if (!u) return NextResponse.json({ error: 'Universe not found' }, { status: 404 });

    const list = await db
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
        creatorName: user.name,
      })
      .from(rooms)
      .leftJoin(user, eq(rooms.createdById, user.id))
      .leftJoin(themes, eq(rooms.themeId, themes.id))
      .where(eq(rooms.universeId, u.id))
      .orderBy(desc(rooms.createdAt));

    return NextResponse.json(list);
  } catch (e) {
    console.error('GET /api/universes/[slug]/rooms', e);
    return NextResponse.json({ error: 'Failed to load rooms' }, { status: 500 });
  }
}

/** POST /api/universes/[slug]/rooms — создать комнату (требуется авторизация) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [u] = await db.select().from(universes).where(eq(universes.slug, slug)).limit(1);
    if (!u) return NextResponse.json({ error: 'Universe not found' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const {
      title,
      themeId,
      contentId,
      timeLimitMinutes,
      rounds,
    } = body as {
      title?: string;
      themeId?: string | null;
      contentId?: string | null;
      timeLimitMinutes?: number | null;
      rounds?: Array<{ name: string; durationMinutes?: number | null }>;
    };

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'title required' }, { status: 400 });
    }

    const [room] = await db
      .insert(rooms)
      .values({
        universeId: u.id,
        themeId: themeId && typeof themeId === 'string' ? themeId : null,
        contentId: contentId && typeof contentId === 'string' ? contentId : null,
        title: title.trim(),
        timeLimitMinutes:
          typeof timeLimitMinutes === 'number' && timeLimitMinutes > 0 ? timeLimitMinutes : null,
        createdById: session.user.id,
      })
      .returning();

    if (!room) return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });

    // Добавляем создателя в участники
    await db.insert(roomParticipants).values({
      roomId: room.id,
      userId: session.user.id,
    });

    // Раунды (опционально)
    const roundsList = Array.isArray(rounds) ? rounds : [];
    if (roundsList.length > 0) {
      await db.insert(roomRounds).values(
        roundsList.map((r, i) => ({
          roomId: room.id,
          name: typeof r.name === 'string' ? r.name : `Раунд ${i + 1}`,
          orderIndex: i,
          durationMinutes:
            typeof r.durationMinutes === 'number' && r.durationMinutes > 0
              ? r.durationMinutes
              : null,
        }))
      );
    }

    return NextResponse.json(room);
  } catch (e) {
    console.error('POST /api/universes/[slug]/rooms', e);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
