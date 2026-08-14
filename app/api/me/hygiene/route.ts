import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, userHygieneSettings } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

type DigestDelivery = 'none' | 'in_app' | 'email';

export async function GET(req: NextRequest) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const [row] = await db
      .select()
      .from(userHygieneSettings)
      .where(eq(userHygieneSettings.userId, session.user.id))
      .limit(1);
    const payload = row
      ? {
          focusMode: row.focusMode,
          dailyTimeLimitMinutes: row.dailyTimeLimitMinutes,
          digestDelivery: row.digestDelivery,
        }
      : {
          focusMode: false,
          dailyTimeLimitMinutes: null as number | null,
          digestDelivery: 'none' as DigestDelivery,
        };
    return NextResponse.json(payload);
  } catch (e) {
    console.error('GET /api/me/hygiene', e);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const focusMode = body.focusMode as boolean | undefined;
    const rawLimit = body.dailyTimeLimitMinutes;
    const dailyTimeLimitMinutes =
      rawLimit === undefined
        ? undefined
        : rawLimit === null || rawLimit === ''
          ? null
          : Number(rawLimit);
    const digestDelivery = body.digestDelivery as DigestDelivery | undefined;

    const allowed: DigestDelivery[] = ['none', 'in_app', 'email'];
    const digestOk =
      digestDelivery === undefined || (typeof digestDelivery === 'string' && allowed.includes(digestDelivery));

    if (!digestOk) {
      return NextResponse.json({ error: 'Invalid digestDelivery' }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(userHygieneSettings)
      .where(eq(userHygieneSettings.userId, session.user.id))
      .limit(1);

    const updates: {
      focusMode?: boolean;
      dailyTimeLimitMinutes?: number | null;
      digestDelivery?: DigestDelivery;
      updatedAt?: Date;
    } = { updatedAt: new Date() };
    if (typeof focusMode === 'boolean') updates.focusMode = focusMode;
    if (dailyTimeLimitMinutes !== undefined) {
      updates.dailyTimeLimitMinutes =
        dailyTimeLimitMinutes === null
          ? null
          : Math.max(0, Math.min(24 * 60, Math.floor(Number(dailyTimeLimitMinutes))));
    }
    if (digestDelivery !== undefined) updates.digestDelivery = digestDelivery;

    if (existing) {
      await db
        .update(userHygieneSettings)
        .set(updates)
        .where(eq(userHygieneSettings.userId, session.user.id));
    } else {
      await db.insert(userHygieneSettings).values({
        userId: session.user.id,
        focusMode: updates.focusMode ?? false,
        dailyTimeLimitMinutes: updates.dailyTimeLimitMinutes ?? null,
        digestDelivery: updates.digestDelivery ?? 'none',
      });
    }

    const [row] = await db
      .select({
        focusMode: userHygieneSettings.focusMode,
        dailyTimeLimitMinutes: userHygieneSettings.dailyTimeLimitMinutes,
        digestDelivery: userHygieneSettings.digestDelivery,
      })
      .from(userHygieneSettings)
      .where(eq(userHygieneSettings.userId, session.user.id))
      .limit(1);

    return NextResponse.json(
      row ?? {
        focusMode: updates.focusMode ?? false,
        dailyTimeLimitMinutes: updates.dailyTimeLimitMinutes ?? null,
        digestDelivery: updates.digestDelivery ?? 'none',
      }
    );
  } catch (e) {
    console.error('PATCH /api/me/hygiene', e);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
