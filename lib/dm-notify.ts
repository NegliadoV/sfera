/**
 * Вызов notify для доставки DM получателю через WebSocket.
 */
const WS_SERVER_URL = process.env.WS_SERVER_URL ?? 'http://localhost:3002';
const WS_NOTIFY_SECRET = process.env.WS_NOTIFY_SECRET;

import { sendPushNotification } from '@/lib/push-notify';

export interface DmNewMessagePayload {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string | null;
  body: string;
  attachmentUrl?: string;
  attachmentType?: string;
  createdAt: string;
}

export interface DmReadReceiptPayload {
  readerId: string;
}

/** Отправить событие пользователю (комната user:{userId}). */
export async function notifyUser(
  userId: string,
  event: 'dm_new_message' | 'dm_read_receipt',
  data: DmNewMessagePayload | DmReadReceiptPayload
): Promise<void> {
  try {
    if (event === 'dm_new_message') {
      const msgData = data as DmNewMessagePayload;
      const textBody = msgData.body || (msgData.attachmentUrl ? '[Вложение]' : 'Новое сообщение');
      sendPushNotification(userId, {
        title: `Новое сообщение от ${msgData.senderName || 'Пользователя'}`,
        body: textBody.length > 100 ? textBody.slice(0, 100) + '...' : textBody,
        url: `/messages/${msgData.senderId}`,
      }).catch(err => console.error('[dm-notify] Push error:', err));
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (WS_NOTIFY_SECRET) {
      headers['X-Notify-Secret'] = WS_NOTIFY_SECRET;
    }

    const res = await fetch(`${WS_SERVER_URL}/notify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        targetType: 'user',
        targetId: userId,
        event,
        data,
      }),
    });
    if (!res.ok) {
      console.warn('[dm-notify] Notify failed:', res.status, await res.text());
    }
  } catch (e) {
    console.warn('[dm-notify] Notify error (is ws-server running?):', e);
  }
}
