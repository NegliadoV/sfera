import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, userBlocks, user } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** GET /api/me/blocks */
export async function GET() {
  const session = await auth();
  const me = session?.user?.id;
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const rows = await db.select({ id: user.id, name: user.name, image: user.image }).from(userBlocks).innerJoin(user, eq(userBlocks.blockedId, user.id)).where(eq(userBlocks.blockerId, me));
    return NextResponse.json(rows);
  } catch (e) {
    console.error('GET /api/me/blocks', e);
    return NextResponse.json({ error: 'Failed to load blocks' }, { status: 500 });
  }
}

/** POST /api/me/blocks */
export async function POST(req: NextRequest) {
  const session = await auth();
  const me = session?.user?.id;
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const blockedUserId = (body?.blockedUserId ?? body?.userId)?.trim?.();
    if (!blockedUserId) return NextResponse.json({ error: 'blockedUserId required' }, { status: 400 });
    if (blockedUserId === me) return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
    const [target] = await db.select().from(user).where(eq(user.id, blockedUserId)).limit(1);
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    await db.insert(userBlocks).values({ blockerId: me, blockedId: blockedUserId }).onConflictDoNothing({ target: [userBlocks.blockerId, userBlocks.blockedId] });
    return NextResponse.json({ ok: true, blockedId: blockedUserId });
  } catch (e) {
    console.error('POST /api/me/blocks', e);
    return NextResponse.json({ error: 'Failed to block' }, { status: 500 });
  }
}
