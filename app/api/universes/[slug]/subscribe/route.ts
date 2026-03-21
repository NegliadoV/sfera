import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, universes, universeSubscriptions } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await params;
  const [universe] = await db
    .select()
    .from(universes)
    .where(eq(universes.slug, slug))
    .limit(1);

  if (!universe || !universe.isPrivate) {
    return NextResponse.json({ error: 'This universe is not private or does not exist.' }, { status: 400 });
  }

  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;

  if (!shopId || !secretKey) {
    // В режиме разработки или при отсутствии ключей симулируем успешную оплату для демо-целей
    console.warn('[yookassa] YOOKASSA_SHOP_ID or YOOKASSA_SECRET_KEY missing, simulating success');
    const existing = await db
      .select()
      .from(universeSubscriptions)
      .where(
        and(
          eq(universeSubscriptions.userId, session.user.id),
          eq(universeSubscriptions.universeId, universe.id)
        )
      )
      .limit(1);

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    if (existing.length > 0) {
      await db
        .update(universeSubscriptions)
        .set({ status: 'active', currentPeriodEnd: expiresAt })
        .where(eq(universeSubscriptions.id, existing[0].id));
    } else {
      await db.insert(universeSubscriptions).values({
        userId: session.user.id,
        universeId: universe.id,
        status: 'active',
        currentPeriodEnd: expiresAt,
      });
    }

    return NextResponse.json({
      confirmationUrl: `/universes/${encodeURIComponent(slug)}/content`,
    });
  }

  try {
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/universes/${encodeURIComponent(slug)}/content`;

    const paymentBody = {
      amount: {
        value: (universe.monthlyPrice ?? 0).toFixed(2),
        currency: 'RUB',
      },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: returnUrl,
      },
      description: `Подписка на закрытую сферу Знаний: ${universe.name}`,
      save_payment_method: true,
      metadata: {
        userId: session.user.id,
        universeId: universe.id,
      },
    };

    const authHeader = 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64');
    const idempotenceKey = crypto.randomUUID();

    const yooRes = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
        'Idempotence-Key': idempotenceKey,
      },
      body: JSON.stringify(paymentBody),
    });

    if (!yooRes.ok) {
      const errorText = await yooRes.text();
      console.error('[yookassa] Error creating payment', yooRes.status, errorText);
      return NextResponse.json({ error: 'Payment gateway error' }, { status: 500 });
    }

    const yooData = await yooRes.json();
    return NextResponse.json({ confirmationUrl: yooData.confirmation.confirmation_url });
  } catch (error) {
    console.error('[yookassa] unexpected error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
