import { NextResponse, NextRequest } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, universes } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const [u] = await db
      .select({
        id: universes.id,
        slug: universes.slug,
        name: universes.name,
        description: universes.description,
        isPrivate: universes.isPrivate,
        monthlyPrice: universes.monthlyPrice,
        sphereColor: universes.sphereColor,
        createdById: universes.ownerId,
      })
      .from(universes)
      .where(eq(universes.slug, slug));
    if (!u) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(u);
  } catch (e) {
    console.error('GET /api/universes/[slug]', e);
    return NextResponse.json({ error: 'Failed to load universe' }, { status: 500 });
  }
}

/** Удаление вселенной. Только владелец (в т.ч. сид-пользователь). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSessionForRequest(_req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  try {
    const [u] = await db.select().from(universes).where(eq(universes.slug, slug)).limit(1);
    if (!u) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (u.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: only the owner can delete this universe' }, { status: 403 });
    }
    await db.delete(universes).where(eq(universes.id, u.id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/universes/[slug]', e);
    return NextResponse.json({ error: 'Failed to delete universe' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  try {
    const [u] = await db.select().from(universes).where(eq(universes.slug, slug)).limit(1);
    if (!u) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (u.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const json = await req.json();
    const updateData: Partial<typeof universes.$inferInsert> = {};

    if (json.name !== undefined) updateData.name = json.name;
    if (json.description !== undefined) updateData.description = json.description;
    if (json.isPrivate !== undefined) updateData.isPrivate = !!json.isPrivate;
    if (json.monthlyPrice !== undefined) updateData.monthlyPrice = json.monthlyPrice ? Number(json.monthlyPrice) : null;
    if (json.sphereColor !== undefined) updateData.sphereColor = json.sphereColor;
    
    // Slug is required for returning the new slug but let's not let them change the slug here to avoid complexity issues with existing URLs.

    await db.update(universes)
      .set(updateData)
      .where(eq(universes.id, u.id));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('PATCH /api/universes/[slug]', e);
    return NextResponse.json({ error: 'Failed to update universe' }, { status: 500 });
  }
}
