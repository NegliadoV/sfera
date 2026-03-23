import { NextResponse } from 'next/server';
import { db, content, notifications } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import { getSessionForServerComponent } from '@/lib/session';

export async function POST(req: Request, { params }: { params: Promise<{ contentId: string }> }) {
  try {
    const session = await getSessionForServerComponent();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contentId } = await params;

    // Increment savesCount atomically
    await db
      .update(content)
      .set({ savesCount: sql`${content.savesCount} + 1` })
      .where(eq(content.id, contentId));

    // Send Gamification Notification to Author
    const [savedContent] = await db.select().from(content).where(eq(content.id, contentId));
    if (savedContent && savedContent.authorId !== session.user.id) {
      await db.insert(notifications).values({
        userId: savedContent.authorId,
        universeId: savedContent.universeId,
        contentId: savedContent.id,
        type: 'save',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to increment savesCount', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
