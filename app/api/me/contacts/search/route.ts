import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, user, userBlocks } from '@/lib/db';
import { eq, ilike, sql, and, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 20;

/** GET /api/me/contacts/search?query=... — поиск по тегу, имени или email */
export async function GET(req: NextRequest) {
  const session = await getSessionForRequest(req);
  const me = session?.user?.id;
  if (!me) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  let query = searchParams.get('query')?.trim() ?? '';
  query = query.replace(/^@+/, '').toLowerCase();
  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ error: `Query must be at least ${MIN_QUERY_LENGTH} characters` }, { status: 400 });
  }

  try {
    const pattern = `%${query}%`;
    const blockedByMe = await db
      .select({ blockedId: userBlocks.blockedId })
      .from(userBlocks)
      .where(eq(userBlocks.blockerId, me));
    const blockedIds = blockedByMe.map((b) => b.blockedId);

    let rows: Array<{ id: string; name: string | null; image: string | null; userTag: string | null }>;
    try {
      rows = await db
        .select({
          id: user.id,
          name: user.name,
          image: user.image,
          userTag: user.userTag,
        })
        .from(user)
        .where(
          and(
            sql`${user.id} != ${me}`,
            or(
              sql`${user.userTag} IS NOT NULL AND ${user.userTag} ILIKE ${pattern}`,
              sql`${user.name} IS NOT NULL AND LOWER(${user.name}) LIKE ${pattern}`,
              sql`${user.email} IS NOT NULL AND LOWER(${user.email}) LIKE ${pattern}`
            )
          )
        )
        .limit(MAX_RESULTS + blockedIds.length);
    } catch (searchErr) {
      const errMsg = String((searchErr as Error).message || '');
      if (/user_tag/.test(errMsg)) {
        rows = await db
          .select({
            id: user.id,
            name: user.name,
            image: user.image,
            userTag: sql<string | null>`NULL`.as('userTag'),
          })
          .from(user)
          .where(
            and(
              sql`${user.id} != ${me}`,
              or(
                sql`${user.name} IS NOT NULL AND LOWER(${user.name}) LIKE ${pattern}`,
                sql`${user.email} IS NOT NULL AND LOWER(${user.email}) LIKE ${pattern}`
              )
            )
          )
          .limit(MAX_RESULTS + blockedIds.length);
      } else {
        throw searchErr;
      }
    }

    const filtered = blockedIds.length > 0
      ? rows.filter((r) => !blockedIds.includes(r.id))
      : rows;
    const result = filtered.slice(0, MAX_RESULTS);

    return NextResponse.json(result);
  } catch (e) {
    console.error('GET /api/me/contacts/search', e);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
