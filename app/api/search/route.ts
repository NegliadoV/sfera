import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, user, universes, content } from '@/lib/db';
import { ilike, or, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const likeQuery = `%${query}%`;

    // 1. Search Users
    const usersResult = await db
      .select({
        id: user.id,
        name: user.name,
        userTag: user.userTag,
        image: user.image,
      })
      .from(user)
      .where(or(ilike(user.name, likeQuery), ilike(user.userTag, likeQuery)))
      .limit(10);

    // 2. Search Universes
    const universesResult = await db
      .select({
        id: universes.id,
        slug: universes.slug,
        name: universes.name,
        description: universes.description,
        icon: universes.icon,
      })
      .from(universes)
      .where(or(ilike(universes.name, likeQuery), ilike(universes.slug, likeQuery), ilike(universes.description, likeQuery)))
      .limit(10);

    // 3. Search Content (Posts)
    const contentResult = await db
      .select({
        id: content.id,
        title: content.title,
        body: content.body,
        universeSlug: universes.slug,
      })
      .from(content)
      .leftJoin(universes, eq(content.universeId, universes.id))
      .where(or(ilike(content.title, likeQuery), ilike(content.body, likeQuery)))
      .limit(10);

    // Format all results uniformly
    const unifiedResults = [
      ...usersResult.map(u => ({
        type: 'user',
        id: u.id,
        title: u.name || 'Пользователь',
        subtitle: u.userTag ? `@${u.userTag}` : '',
        image: u.image,
        link: `/profile/${u.id}`,
      })),
      ...universesResult.map(u => ({
        type: 'universe',
        id: u.id,
        title: u.name,
        subtitle: u.description || `Сфера @${u.slug}`,
        image: u.icon,
        link: `/universe/${u.slug}`,
      })),
      ...contentResult.map(c => ({
        type: 'content',
        id: c.id,
        title: c.title,
        subtitle: (c.body || '').substring(0, 60),
        image: null,
        link: `/content/${c.id}`,
      })),
    ];

    return NextResponse.json({ results: unifiedResults });
  } catch(e) {
    console.error('Search API Error', e);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
