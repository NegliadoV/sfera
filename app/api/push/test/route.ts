import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { auth } from '@/auth';
import { eq } from 'drizzle-orm';
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:hello@horizon.dev',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, body, icon, url } = await req.json();

    const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, session.user.id));

    if (subs.length === 0) {
      return NextResponse.json({ error: 'No active subscriptions found for this user' }, { status: 404 });
    }

    const payload = JSON.stringify({
      title: title || 'Тестовое уведомление Horizon',
      body: body || 'Push-уведомления успешно настроены!',
      icon: icon || '/logo.png',
      url: url || '/',
    });

    let successCount = 0;
    const sendPromises = subs.map(async (sub) => {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          }
        }, payload);
        successCount++;
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log(`Subscription expired/failed for endpoint ${sub.endpoint}, removing...`);
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
        } else {
          console.error('Error sending push notification', err);
        }
      }
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, count: successCount, total: subs.length });
  } catch (error: any) {
    console.error('Push Test Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
