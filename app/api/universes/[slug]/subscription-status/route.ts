import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, universes, universeSubscriptions } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const [universe] = await db
      .select({ id: universes.id })
      .from(universes)
      .where(eq(universes.slug, slug))
      .limit(1);

    if (!universe) {
      return NextResponse.json({ error: 'Universe not found' }, { status: 404 });
    }

    const [sub] = await db
      .select({
        status: universeSubscriptions.status,
        currentPeriodEnd: universeSubscriptions.currentPeriodEnd,
      })
      .from(universeSubscriptions)
      .where(
        and(
          eq(universeSubscriptions.userId, session.user.id),
          eq(universeSubscriptions.universeId, universe.id)
        )
      )
      .limit(1);

    if (sub && sub.status === 'active') {
      const isExpired = sub.currentPeriodEnd && new Date() > new Date(sub.currentPeriodEnd);
      return NextResponse.json({ isActive: !isExpired });
    }

    return NextResponse.json({ isActive: false });
  } catch (e) {
    console.error('GET /api/universes/[slug]/subscription-status', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
