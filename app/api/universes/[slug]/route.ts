import { NextResponse } from 'next/server';
import { auth } from '@/auth';
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
      .select()
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
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
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
