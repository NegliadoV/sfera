import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, contacts, user } from '@/lib/db';
import { eq, or, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** GET /api/me/contacts — список контактов текущего пользователя */
export async function GET() {
  const session = await auth();
  const me = session?.user?.id;
  if (!me) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const contactRows = await db
      .select()
      .from(contacts)
      .where(or(eq(contacts.userIdA, me), eq(contacts.userIdB, me)));

    const otherIds = contactRows.map((c) => (c.userIdA === me ? c.userIdB : c.userIdA));
    if (otherIds.length === 0) {
      return NextResponse.json([]);
    }

    const users = await db
      .select({ id: user.id, name: user.name, email: user.email, image: user.image })
      .from(user)
      .where(inArray(user.id, otherIds));

    return NextResponse.json(users);
  } catch (e) {
    console.error('GET /api/me/contacts', e);
    return NextResponse.json({ error: 'Failed to load contacts' }, { status: 500 });
  }
}
