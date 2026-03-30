import { db } from '@/lib/db';
import { liveSpaces } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSessionForServerComponent } from '@/lib/session';
import { AccessToken } from 'livekit-server-sdk';
import RoomClient from './RoomClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RoomPage({ params }: { params: Promise<{ uid: string }> | { uid: string } }) {
  const session = await getSessionForServerComponent();
  const roomId = (await Promise.resolve(params)).uid;

  if (!session?.user?.id) {
    return (
      <div className="studio-page-wrap">
        <div className="studio-card" style={{ maxWidth: '800px', padding: 40, textAlign: 'center' }}>
          <h2 style={{ marginBottom: 16 }}>Войдите в аккаунт</h2>
          <p style={{ color: 'var(--text-muted)' }}>Для участия в аудиокомнатах необходимо авторизоваться.</p>
        </div>
      </div>
    );
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return (
      <div className="studio-page-wrap">
        <div className="studio-card" style={{ maxWidth: '800px', padding: 40, textAlign: 'center' }}>
          <h2 style={{ marginBottom: 16 }}>Ошибка подключения</h2>
          <p style={{ color: 'var(--alert-error)' }}>LiveKit is not configured on the server.</p>
        </div>
      </div>
    );
  }

  const [space] = await db
    .select()
    .from(liveSpaces)
    .where(eq(liveSpaces.id, roomId))
    .limit(1);

  if (!space) {
    return (
      <div className="studio-page-wrap">
        <div className="studio-card" style={{ maxWidth: '800px', padding: 40, textAlign: 'center' }}>
          <h2 style={{ marginBottom: 16 }}>Комната не найдена</h2>
          <p style={{ color: 'var(--text-muted)' }}>Возможно сессия была завершена или удалена.</p>
        </div>
      </div>
    );
  }

  const isModerator = space.creatorId === session.user.id;
  const isOpenMic = space.isOpenMic === true;
  const canPublish = isModerator || isOpenMic;

  // Добавляем случайный суффикс на время отладки, чтобы обойти ошибку DUPLICATE_IDENTITY,
  // когда Next.js кэширует сессию или браузеры имеют один и тот же JWT-токен в куках.
  const uniqueIdentity = session.user.id + '-' + Math.random().toString(36).substring(7);

  const at = new AccessToken(apiKey, apiSecret, {
    identity: uniqueIdentity,
    name: session.user.name || 'Anonymous',
    metadata: JSON.stringify({
      role: isModerator ? 'moderator' : isOpenMic ? 'speaker' : 'listener',
      handRaised: false,
      isOpenMic
    })
  });

  at.addGrant({ 
    roomJoin: true, 
    room: roomId,
    canPublish: canPublish,
    canSubscribe: true,
    canPublishData: true,
  });

  const token = await at.toJwt();

  return <RoomClient initialToken={token} rId={roomId} isOpenMic={isOpenMic} canPublish={canPublish} />;
}
