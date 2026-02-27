import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, userBlocks } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** DELETE /api/me/blocks/[userId] */
export async function DELETE(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  const me = session?.user?.id;
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { userId } = await params;
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
  try {
    await db.delete(userBlocks).where(and(eq(userBlocks.blockerId, me), eq(userBlocks.blockedId, userId)));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/me/blocks/[userId]', e);
    return NextResponse.json({ error: 'Failed to unblock' }, { status: 500 });
  }
}
