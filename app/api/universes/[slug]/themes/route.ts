import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, universes, themes } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** GET /api/universes/[slug]/themes — список тем вселенной */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const [u] = await db.select().from(universes).where(eq(universes.slug, slug)).limit(1);
    if (!u) return NextResponse.json({ error: 'Universe not found' }, { status: 404 });

    const list = await db
      .select({ id: themes.id, name: themes.name, createdAt: themes.createdAt })
      .from(themes)
      .where(eq(themes.universeId, u.id))
      .orderBy(asc(themes.name));

    return NextResponse.json(list);
  } catch (e) {
    console.error('GET /api/universes/[slug]/themes', e);
    return NextResponse.json({ error: 'Failed to load themes' }, { status: 500 });
  }
}

/** POST /api/universes/[slug]/themes — создать тему (требуется авторизация) */
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
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }

    const [inserted] = await db
      .insert(themes)
      .values({ universeId: u.id, name })
      .returning();

    return NextResponse.json(inserted);
  } catch (e) {
    console.error('POST /api/universes/[slug]/themes', e);
    return NextResponse.json({ error: 'Failed to create theme' }, { status: 500 });
  }
}
