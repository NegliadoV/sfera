import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { liveSpaces, liveSpaceParticipants } from '@/lib/db/schema';
import { getSessionForRequest } from '@/lib/session';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** GET /api/spaces — получить список активных глобальных комнат */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionForRequest(req);
    const activeSpaces = await db
      .select()
      .from(liveSpaces)
      .where(eq(liveSpaces.isActive, true))
      .orderBy(desc(liveSpaces.createdAt))
      .limit(50);

    return NextResponse.json({ spaces: activeSpaces, currentUserId: session?.user?.id || null });
  } catch (e) {
    console.error('[spaces GET]', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/** POST /api/spaces — создать новую глобальную комнату */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionForRequest(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, isPrivate, isOpenMic, universeId, type = 'audio' } = await req.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Создаем комнату (live_spaces)
    const [newSpace] = await db.insert(liveSpaces).values({
      name: name.trim(),
      description: description?.trim() || null,
      type: type,
      isPrivate: !!isPrivate,
      isOpenMic: !!isOpenMic,
      universeId: universeId || null,
      creatorId: session.user.id,
      isActive: true,
    }).returning();

    // Добавляем создателя как спикера
    await db.insert(liveSpaceParticipants).values({
      spaceId: newSpace.id,
      userId: session.user.id,
      role: 'speaker',
    });

    return NextResponse.json({ space: newSpace });
  } catch (e) {
    console.error('[spaces POST]', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
