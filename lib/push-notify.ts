import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import webpush from 'web-push';

const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:hello@horizon.dev';
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn('[push-notify] VAPID keys are missing. Web Push notifications will not be sent.');
}

/**
 * Отправляет Web Push уведомление на все активные подписки пользователя.
 * Неблокирующая функция (перехватывает все ошибки).
 */
export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; url?: string; icon?: string }
): Promise<void> {
  if (!vapidPublicKey || !vapidPrivateKey) return;

  try {
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (subs.length === 0) return;

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/logo.png', // Иконка по умолчанию
      url: payload.url || '/',
    });

    const sendPromises = subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          pushPayload
        );
      } catch (err: unknown) {
        // Удаляем "мертвые" или отписанные endpoint'ы
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          console.log(`[push-notify] Subscription expired for ${userId}, removing endpoint...`);
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
        } else {
          console.error(`[push-notify] Error sending to user ${userId}:`, err);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (err) {
    console.error('[push-notify] Global error sending push:', err);
  }
}
