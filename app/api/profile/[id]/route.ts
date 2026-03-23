import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, user, universes } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionForRequest(req);
  const { id } = await params;

  try {
    const [profile] = await db
      .select({
        id: user.id,
        name: user.name,
        image: user.image,
        userTag: user.userTag,
      })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const publicUniverses = await db
      .select({
        id: universes.id,
        slug: universes.slug,
        name: universes.name,
        description: universes.description,
        icon: universes.icon,
      })
      .from(universes)
      .where(and(eq(universes.ownerId, id), eq(universes.isPrivate, false)))
      .limit(10);

    return NextResponse.json({ ...profile, universes: publicUniverses });
  } catch (e) {
    console.error('GET /api/profile/[id]', e);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}
