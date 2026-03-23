import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, userPrivacySettings } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** GET /api/me/privacy */
export async function GET(req: NextRequest) {
  const session = await getSessionForRequest(req);
  const me = session?.user?.id;
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const [row] = await db.select().from(userPrivacySettings).where(eq(userPrivacySettings.userId, me)).limit(1);
    return NextResponse.json({ dmOnlyContacts: row?.dmOnlyContacts ?? false });
  } catch (e) {
    console.error('GET /api/me/privacy', e);
    return NextResponse.json({ error: 'Failed to load privacy settings' }, { status: 500 });
  }
}

/** PATCH /api/me/privacy */
export async function PATCH(req: NextRequest) {
  const session = await getSessionForRequest(req);
  const me = session?.user?.id;
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const dmOnlyContacts = body.dmOnlyContacts as boolean | undefined;
    const [existing] = await db.select().from(userPrivacySettings).where(eq(userPrivacySettings.userId, me)).limit(1);
    if (existing) {
      await db.update(userPrivacySettings).set({
        dmOnlyContacts: typeof dmOnlyContacts === 'boolean' ? dmOnlyContacts : existing.dmOnlyContacts,
        updatedAt: new Date(),
      }).where(eq(userPrivacySettings.userId, me));
    } else {
      await db.insert(userPrivacySettings).values({
        userId: me,
        dmOnlyContacts: typeof dmOnlyContacts === 'boolean' ? dmOnlyContacts : false,
      });
    }
    const [row] = await db.select({ dmOnlyContacts: userPrivacySettings.dmOnlyContacts }).from(userPrivacySettings).where(eq(userPrivacySettings.userId, me)).limit(1);
    return NextResponse.json({ dmOnlyContacts: row?.dmOnlyContacts ?? false });
  } catch (e) {
    console.error('PATCH /api/me/privacy', e);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
