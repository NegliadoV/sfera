import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, user } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/me
 * Возвращает информацию о текущем пользователе (используется в мобильном приложении)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [found] = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        userTag: user.userTag,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!found) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: found.id,
      email: found.email,
      name: found.name,
      image: found.image,
      userTag: found.userTag,
    });
  } catch (e) {
    console.error('GET /api/me', e);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
