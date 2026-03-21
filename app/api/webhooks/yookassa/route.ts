import { NextRequest, NextResponse } from 'next/server';
import { db, universeSubscriptions } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const event = rawBody.event;
    const payment = rawBody.object;

    if (!event || !payment) {
      return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
    }

    if (event === 'payment.succeeded') {
      const { userId, universeId } = payment.metadata || {};

      if (!userId || !universeId) {
        console.warn('[yookassa webhook] No metadata found for successful payment', payment.id);
        return NextResponse.json({ success: true });
      }

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const existing = await db
        .select()
        .from(universeSubscriptions)
        .where(
          and(
            eq(universeSubscriptions.userId, userId),
            eq(universeSubscriptions.universeId, universeId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(universeSubscriptions)
          .set({
            status: 'active',
            currentPeriodEnd: expiresAt,
            paymentMethodId: payment.payment_method?.id ?? null,
            updatedAt: new Date(),
          })
          .where(eq(universeSubscriptions.id, existing[0].id));
      } else {
        await db.insert(universeSubscriptions).values({
          userId,
          universeId,
          status: 'active',
          currentPeriodEnd: expiresAt,
          paymentMethodId: payment.payment_method?.id ?? null,
        });
      }

      console.log(`[yookassa webhook] Activated subscription for User ${userId} in Universe ${universeId}`);
    }

    // You can process 'payment.canceled' or 'refund.succeeded' events here.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[yookassa webhook] unexpected error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
