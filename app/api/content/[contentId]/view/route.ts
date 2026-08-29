import { NextRequest, NextResponse } from 'next/server';
import { db, content, userContentViews } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';
import { getSessionForRequest } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const session = await getSessionForRequest(req);
    if (!session?.user?.id) {
      // Для гостей просто возвращаем success
      return NextResponse.json({ success: true, guest: true });
    }

    const { contentId } = await params;
    if (!contentId) {
      return NextResponse.json({ error: 'Content ID required' }, { status: 400 });
    }

    // Находим пост для получения universeId
    const [c] = await db
      .select({ id: content.id, universeId: content.universeId })
      .from(content)
      .where(eq(content.id, contentId))
      .limit(1);

    if (!c) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Upsert в user_content_views
    await db
      .insert(userContentViews)
      .values({
        userId: session.user.id,
        contentId: c.id,
        universeId: c.universeId,
        viewCount: 1,
        lastViewedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [userContentViews.userId, userContentViews.contentId],
        set: {
          viewCount: sql`${userContentViews.viewCount} + 1`,
          lastViewedAt: new Date(),
        },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/content/[contentId]/view error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
