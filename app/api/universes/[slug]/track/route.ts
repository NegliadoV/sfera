import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, universeTracking, universes } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { normalizeUniverseSlug } from '@/lib/universe-slug';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const slug = normalizeUniverseSlug((await params).slug);
  if (!slug) return NextResponse.json({ tracking: false });

  const session = await getSessionForRequest(req);
  if (!session?.user?.id) return NextResponse.json({ tracking: false });

  try {
    const [u] = await db.select().from(universes).where(eq(universes.slug, slug)).limit(1);
    if (!u) return NextResponse.json({ tracking: false });

    const [row] = await db
      .select()
      .from(universeTracking)
      .where(
        and(
          eq(universeTracking.universeId, u.id),
          eq(universeTracking.userId, session.user.id)
        )
      )
      .limit(1);
    return NextResponse.json({ tracking: !!row });
  } catch (e) {
    console.error('GET /api/universes/[slug]/track', e);
    return NextResponse.json({ tracking: false });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const slug = normalizeUniverseSlug((await params).slug);
  if (!slug) return NextResponse.json({ error: 'Universe not found' }, { status: 404 });

  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [u] = await db.select().from(universes).where(eq(universes.slug, slug)).limit(1);
    if (!u) return NextResponse.json({ error: 'Universe not found' }, { status: 404 });

    await db
      .delete(universeTracking)
      .where(
        and(
          eq(universeTracking.universeId, u.id),
          eq(universeTracking.userId, session.user.id)
        )
      );
    return NextResponse.json({ tracking: false });
  } catch (e) {
    console.error('DELETE /api/universes/[slug]/track', e);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const slug = normalizeUniverseSlug((await params).slug);
  if (!slug) return NextResponse.json({ error: 'Universe not found' }, { status: 404 });

  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [u] = await db.select().from(universes).where(eq(universes.slug, slug)).limit(1);
    if (!u) return NextResponse.json({ error: 'Universe not found' }, { status: 404 });

    const [row] = await db
      .select()
      .from(universeTracking)
      .where(
        and(
          eq(universeTracking.universeId, u.id),
          eq(universeTracking.userId, session.user.id)
        )
      )
      .limit(1);

    if (row) {
      await db
        .delete(universeTracking)
        .where(
          and(
            eq(universeTracking.universeId, u.id),
            eq(universeTracking.userId, session.user.id)
          )
        );
      return NextResponse.json({ tracking: false });
    } else {
      await db.insert(universeTracking).values({
        universeId: u.id,
        userId: session.user.id,
      });
      return NextResponse.json({ tracking: true });
    }
  } catch (e) {
    console.error('POST /api/universes/[slug]/track', e);
    return NextResponse.json({ error: 'Failed to toggle tracking' }, { status: 500 });
  }
}
