/**
 * Уведомление участников группового чата о новом сообщении.
 */
const WS_SERVER_URL = process.env.WS_SERVER_URL ?? 'http://localhost:3002';
const WS_NOTIFY_SECRET = process.env.WS_NOTIFY_SECRET;

import { sendPushNotification } from '@/lib/push-notify';

export interface GroupNewMessagePayload {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string | null;
  body: string;
  attachmentUrl?: string;
  attachmentType?: string;
  createdAt: string;
}

/** Отправить group_new_message каждому участнику (кроме отправителя). */
export async function notifyGroupMessage(
  participantIds: string[],
  senderId: string,
  data: GroupNewMessagePayload
): Promise<void> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (WS_NOTIFY_SECRET) headers['X-Notify-Secret'] = WS_NOTIFY_SECRET;

  const targets = participantIds.filter((id) => id !== senderId);
  const textBody = data.body || (data.attachmentUrl ? '[Вложение]' : 'Новое сообщение');
  const excerpt = textBody.length > 100 ? textBody.slice(0, 100) + '...' : textBody;

  await Promise.all(
    targets.map((userId) => {
      // Отправляем Web Push асинхронно
      sendPushNotification(userId, {
        title: `Групповое сообщение от ${data.senderName || 'Пользователя'}`,
        body: excerpt,
        url: `/messages/group/${data.groupId}`,
      }).catch(err => console.error('[group-chat-notify] Push error:', err));

      return fetch(`${WS_SERVER_URL}/notify`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          targetType: 'user',
          targetId: userId,
          event: 'group_new_message',
          data,
        }),
      }).catch((e) => {
        console.warn('[group-chat-notify] Notify failed for', userId, e);
      });
    })
  );
}
