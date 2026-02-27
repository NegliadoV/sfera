import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, userContent } from '@/lib/db';
import { eq, asc, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
  const offset = Number(searchParams.get('offset')) || 0;
  const sourceId = searchParams.get('sourceId');

  try {
    const whereClause = sourceId
      ? and(eq(userContent.userId, session.user.id), eq(userContent.sourceId, sourceId))
      : eq(userContent.userId, session.user.id);

    const list = await db
      .select()
      .from(userContent)
      .where(whereClause)
      .orderBy(asc(userContent.publishedAt), asc(userContent.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(list);
  } catch (e) {
    console.error('GET /api/me/content', e);
    return NextResponse.json({ error: 'Failed to load content' }, { status: 500 });
  }
}
