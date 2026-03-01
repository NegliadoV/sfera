import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, userContent, content, universeMembers, universeTracking, universes } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { userContentId, universeId } = body as { userContentId: string; universeId: string };

    if (!userContentId || !universeId) {
      return NextResponse.json({ error: 'userContentId and universeId required' }, { status: 400 });
    }

    const [uc] = await db
      .select()
      .from(userContent)
      .where(and(eq(userContent.id, userContentId), eq(userContent.userId, session.user.id)))
      .limit(1);

    if (!uc) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    const [universe] = await db
      .select()
      .from(universes)
      .where(eq(universes.id, universeId))
      .limit(1);

    if (!universe) {
      return NextResponse.json({ error: 'Universe not found' }, { status: 404 });
    }

    const isOwner = universe.ownerId === session.user.id;
    const [membership] = await db
      .select()
      .from(universeMembers)
      .where(and(eq(universeMembers.universeId, universeId), eq(universeMembers.userId, session.user.id)))
      .limit(1);
    const [tracking] = await db
      .select()
      .from(universeTracking)
      .where(and(eq(universeTracking.universeId, universeId), eq(universeTracking.userId, session.user.id)))
      .limit(1);

    if (!isOwner && !membership && !tracking) {
      return NextResponse.json({ error: 'Должны быть владельцем, участником или отслеживать сферу' }, { status: 403 });
    }

    const [inserted] = await db
      .insert(content)
      .values({
        universeId,
        authorId: session.user.id,
        type: uc.type,
        title: uc.title,
        url: uc.url,
        body: uc.body,
        imageUrl: uc.imageUrl,
        publishedAt: uc.publishedAt,
        externalAuthor: uc.externalAuthor,
        tags: uc.tags,
        sourceId: null,
      })
      .returning();

    return NextResponse.json(inserted);
  } catch (e) {
    console.error('POST /api/me/content/share', e);
    return NextResponse.json({ error: 'Failed to share' }, { status: 500 });
  }
}
