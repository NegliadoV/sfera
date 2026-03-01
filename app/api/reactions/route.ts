import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, reactions } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';

function asTargetType(s: string): 'content' | 'comment' {
  return s === 'comment' ? 'comment' : 'content';
}

export const dynamic = 'force-dynamic';

const REACTION_TYPES = ['confirm_source', 'please_clarify', 'important_counterargument'] as const;
const TARGET_TYPES = ['content', 'comment'] as const;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetType = searchParams.get('targetType');
  const targetId = searchParams.get('targetId');
  if (!targetType || !targetId || !TARGET_TYPES.includes(targetType as 'content' | 'comment')) {
    return NextResponse.json({ error: 'targetType and targetId required' }, { status: 400 });
  }
  try {
    const counts = await db
      .select({
        reactionType: reactions.reactionType,
        count: sql<number>`count(*)::int`,
      })
      .from(reactions)
      .where(and(eq(reactions.targetType, targetType as 'content' | 'comment'), eq(reactions.targetId, targetId)))
      .groupBy(reactions.reactionType);
    const session = await getSessionForRequest(req);
    let myReaction: string | null = null;
    if (session?.user?.id) {
      const [mine] = await db
        .select({ reactionType: reactions.reactionType })
        .from(reactions)
        .where(
          and(
            eq(reactions.targetType, targetType as 'content' | 'comment'),
            eq(reactions.targetId, targetId),
            eq(reactions.userId, session.user.id)
          )
        );
      myReaction = mine?.reactionType ?? null;
    }
    const summary: Record<string, number> = {};
    for (const t of REACTION_TYPES) summary[t] = 0;
    for (const row of counts) summary[row.reactionType] = row.count;
    return NextResponse.json({ counts: summary, myReaction });
  } catch (e) {
    console.error('GET /api/reactions', e);
    return NextResponse.json({ error: 'Failed to load reactions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { targetType, targetId, reactionType } = body as {
      targetType: string;
      targetId: string;
      reactionType: string;
    };
    if (!targetType || !targetId || !TARGET_TYPES.includes(targetType as 'content' | 'comment')) {
      return NextResponse.json({ error: 'Invalid targetType' }, { status: 400 });
    }
    if (!reactionType || !REACTION_TYPES.includes(reactionType as (typeof REACTION_TYPES)[number])) {
      return NextResponse.json({ error: 'Invalid reactionType' }, { status: 400 });
    }
    const tt = asTargetType(targetType);
    const tid = String(targetId);
    const rt = reactionType as (typeof REACTION_TYPES)[number];
    await db.delete(reactions).where(
      and(eq(reactions.targetType, tt), eq(reactions.targetId, tid), eq(reactions.userId, session.user.id))
    );
    await db.insert(reactions).values({
      targetType: tt,
      targetId: tid,
      userId: session.user.id,
      reactionType: rt,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/reactions', e);
    return NextResponse.json({ error: 'Failed to set reaction' }, { status: 500 });
  }
}
