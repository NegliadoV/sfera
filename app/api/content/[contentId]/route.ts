import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, content, user, universes, universeMembers } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { contentId } = await params;
  try {
    const [contentRow] = await db
      .select({ id: content.id, universeId: content.universeId })
      .from(content)
      .where(eq(content.id, contentId))
      .limit(1);

    if (!contentRow) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const [universe] = await db
      .select({ ownerId: universes.ownerId })
      .from(universes)
      .where(eq(universes.id, contentRow.universeId))
      .limit(1);

    if (!universe) {
      return NextResponse.json({ error: 'Universe not found' }, { status: 404 });
    }

    const isOwner = universe.ownerId === session.user.id;
    const isSid = session.user.name === 'Сид';
    const [member] = await db
      .select({ role: universeMembers.role })
      .from(universeMembers)
      .where(
        and(
          eq(universeMembers.universeId, contentRow.universeId),
          eq(universeMembers.userId, session.user.id)
        )
      )
      .limit(1);
    const isModerator = member?.role === 'moderator' || member?.role === 'owner';

    if (!isOwner && !isModerator && !isSid) {
      return NextResponse.json(
        { error: 'Только владелец сферы и модераторы могут удалять посты' },
        { status: 403 }
      );
    }

    await db.delete(content).where(eq(content.id, contentId));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/content/[contentId]', e);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const { contentId } = await params;
  try {
    const [row] = await db
      .select({
        id: content.id,
        universeId: content.universeId,
        authorId: content.authorId,
        authorName: user.name,
        type: content.type,
        title: content.title,
        url: content.url,
        imageUrl: content.imageUrl,
        body: content.body,
        createdAt: content.createdAt,
      })
      .from(content)
      .leftJoin(user, eq(content.authorId, user.id))
      .where(eq(content.id, contentId));
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    console.error('GET /api/content/[contentId]', e);
    return NextResponse.json({ error: 'Failed to load content' }, { status: 500 });
  }
}
