import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, universes, universeSubscriptions } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const list = await db
      .select({
        id: universeSubscriptions.id,
        status: universeSubscriptions.status,
        currentPeriodEnd: universeSubscriptions.currentPeriodEnd,
        universe: {
          slug: universes.slug,
          name: universes.name,
          sphereColor: universes.sphereColor,
          monthlyPrice: universes.monthlyPrice,
        },
      })
      .from(universeSubscriptions)
      .innerJoin(universes, eq(universeSubscriptions.universeId, universes.id))
      .where(eq(universeSubscriptions.userId, session.user.id))
      .orderBy(desc(universeSubscriptions.currentPeriodEnd));

    return NextResponse.json(list);
  } catch (error) {
    console.error('GET /api/me/subscriptions', error);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}
