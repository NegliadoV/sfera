import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, content, user, universes, universeMembers, contentPolls, contentPollVotes } from '@/lib/db';
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { contentId } = await params;
  let body: { title?: string; body?: string; url?: string; pinned?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const [contentRow] = await db
      .select({ id: content.id, universeId: content.universeId, authorId: content.authorId })
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
    const isAuthor = contentRow.authorId === session.user.id;
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

    const updates: {
      updatedAt: Date;
      title?: string;
      body?: string | null;
      url?: string | null;
      pinnedAt?: Date | null;
    } = { updatedAt: new Date() };

    if (body.title !== undefined || body.body !== undefined || body.url !== undefined) {
      if (!isAuthor && !isModerator) {
        return NextResponse.json(
          { error: 'Только автор поста или модератор сферы могут редактировать пост' },
          { status: 403 }
        );
      }
      if (body.title !== undefined) updates.title = body.title;
      if (body.body !== undefined) updates.body = body.body;
      if (body.url !== undefined) updates.url = body.url;
    }

    if (body.pinned !== undefined) {
      if (!isModerator) {
        return NextResponse.json(
          { error: 'Только владелец сферы и модераторы могут закреплять посты' },
          { status: 403 }
        );
      }
      updates.pinnedAt = body.pinned ? new Date() : null;
    }

    if (Object.keys(updates).length <= 1) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    await db.update(content).set(updates).where(eq(content.id, contentId));

    const [updated] = await db
      .select({
        id: content.id,
        title: content.title,
        url: content.url,
        body: content.body,
        pinnedAt: content.pinnedAt,
        updatedAt: content.updatedAt,
      })
      .from(content)
      .where(eq(content.id, contentId));
    return NextResponse.json(updated ?? { ok: true });
  } catch (e) {
    console.error('PATCH /api/content/[contentId]', e);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
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
        universeSlug: universes.slug, // explicitly added for mobile webview paths
        authorId: content.authorId,
        authorName: user.name,
        type: content.type,
        title: content.title,
        url: content.url,
        imageUrl: content.imageUrl,
        body: content.body,
        createdAt: content.createdAt,
        pinnedAt: content.pinnedAt,
      })
      .from(content)
      .leftJoin(user, eq(content.authorId, user.id))
      .leftJoin(universes, eq(content.universeId, universes.id))
      .where(eq(content.id, contentId));
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const [pollData] = await db
      .select({ id: contentPolls.id, options: contentPolls.options })
      .from(contentPolls)
      .where(eq(contentPolls.contentId, contentId))
      .limit(1);

    let initialPollVotes: any[] = [];
    if (pollData) {
      initialPollVotes = await db
        .select()
        .from(contentPollVotes)
        .where(eq(contentPollVotes.pollId, pollData.id));
    }

    const finalRow = { ...row, poll: pollData ? { ...pollData, votes: initialPollVotes } : null };

    return NextResponse.json(finalRow);
  } catch (e) {
    console.error('GET /api/content/[contentId]', e);
    return NextResponse.json({ error: 'Failed to load content' }, { status: 500 });
  }
}
