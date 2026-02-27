import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, universes, mindMaps, user } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** GET /api/universes/[slug]/mind-maps — список ментальных карт вселенной */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const [u] = await db.select().from(universes).where(eq(universes.slug, slug)).limit(1);
    if (!u) return NextResponse.json({ error: 'Universe not found' }, { status: 404 });

    const list = await db
      .select({
        id: mindMaps.id,
        universeId: mindMaps.universeId,
        title: mindMaps.title,
        createdById: mindMaps.createdById,
        createdAt: mindMaps.createdAt,
        updatedAt: mindMaps.updatedAt,
        creatorName: user.name,
      })
      .from(mindMaps)
      .leftJoin(user, eq(mindMaps.createdById, user.id))
      .where(eq(mindMaps.universeId, u.id))
      .orderBy(desc(mindMaps.updatedAt));

    return NextResponse.json(list);
  } catch (e) {
    console.error('GET /api/universes/[slug]/mind-maps', e);
    return NextResponse.json({ error: 'Failed to load mind maps' }, { status: 500 });
  }
}

/** POST /api/universes/[slug]/mind-maps — создать ментальную карту */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [u] = await db.select().from(universes).where(eq(universes.slug, slug)).limit(1);
    if (!u) return NextResponse.json({ error: 'Universe not found' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

    const [map] = await db
      .insert(mindMaps)
      .values({
        universeId: u.id,
        title,
        createdById: session.user.id,
      })
      .returning();

    return NextResponse.json(map);
  } catch (e) {
    console.error('POST /api/universes/[slug]/mind-maps', e);
    return NextResponse.json({ error: 'Failed to create mind map' }, { status: 500 });
  }
}
