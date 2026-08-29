import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, contentResonances } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

type ResonanceType = 'insight' | 'ignite' | 'ponder' | 'resonate' | 'inspire' | 'challenge';
const VALID_TYPES: ResonanceType[] = ['insight', 'ignite', 'ponder', 'resonate', 'inspire', 'challenge'];

// GET /api/content/[contentId]/resonances — all counts + current user choice
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const { contentId } = await params;
  const session = await getSessionForRequest(req);

  try {
    // Aggregate counts per type
    const rows = await db.execute(
      sql`SELECT type, COUNT(*)::int as count FROM content_resonances WHERE content_id = ${contentId} GROUP BY type`
    ) as unknown as Array<{ type: string; count: number }>;

    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.type] = Number(row.count);
    }

    // Current user's choice
    let userChoice: string | null = null;
    if (session?.user?.id) {
      const existing = await db
        .select({ type: contentResonances.type })
        .from(contentResonances)
        .where(
          and(
            eq(contentResonances.contentId, contentId),
            eq(contentResonances.userId, session.user.id)
          )
        )
        .limit(1);
      if (existing[0]) {
        userChoice = existing[0].type;
      }
    }

    return NextResponse.json({ counts, userChoice });
  } catch (e) {
    console.error('GET resonances error:', e);
    return NextResponse.json({ counts: {}, userChoice: null });
  }
}

// POST /api/content/[contentId]/resonances — toggle resonance
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { contentId } = await params;
  const body = await req.json();
  const type: ResonanceType = body.type;

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  try {
    const userId = session.user.id;

    // Check existing
    const existing = await db
      .select()
      .from(contentResonances)
      .where(
        and(
          eq(contentResonances.contentId, contentId),
          eq(contentResonances.userId, userId)
        )
      )
      .limit(1);

    if (existing[0]) {
      if (existing[0].type === type) {
        // Same type → remove (toggle off)
        await db
          .delete(contentResonances)
          .where(
            and(
              eq(contentResonances.contentId, contentId),
              eq(contentResonances.userId, userId)
            )
          );
        return NextResponse.json({ action: 'removed', type });
      } else {
        // Different type → update
        await db
          .update(contentResonances)
          .set({ type })
          .where(
            and(
              eq(contentResonances.contentId, contentId),
              eq(contentResonances.userId, userId)
            )
          );
        return NextResponse.json({ action: 'updated', type });
      }
    } else {
      // Insert new
      await db.insert(contentResonances).values({ contentId, userId, type });
      return NextResponse.json({ action: 'added', type });
    }
  } catch (e) {
    console.error('POST resonances error:', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
