import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, notifications, universes, content } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json([], { status: 200 });
  }
  try {
    const list = await db
      .select({
        id: notifications.id,
        contentId: notifications.contentId,
        universeId: notifications.universeId,
        slug: universes.slug,
        title: content.title,
        type: notifications.type,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .innerJoin(universes, eq(notifications.universeId, universes.id))
      .innerJoin(content, eq(notifications.contentId, content.id))
      .where(eq(notifications.userId, session.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(30);

    const unreadCount = list.filter((n) => !n.readAt).length;

    return NextResponse.json({
      items: list.map((n) => ({
        id: n.id,
        contentId: n.contentId,
        slug: n.slug,
        title: n.title,
        type: n.type,
        read: !!n.readAt,
        createdAt: n.createdAt,
      })),
      unreadCount,
    });
  } catch (e) {
    console.error('GET /api/me/notifications', e);
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const { id, markAll } = body as { id?: string; markAll?: boolean };
    const userId = session.user.id;
    if (markAll === true) {
      await db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(eq(notifications.userId, userId));
      return NextResponse.json({ ok: true });
    }
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, userId)
        )
      );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('PATCH /api/me/notifications', e);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}
