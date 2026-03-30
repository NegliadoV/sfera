import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { getSessionForRequest } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionForRequest(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roomId = req.nextUrl.searchParams.get('room');
    const participantName = session.user.name || 'Anonymous';

    if (!roomId) {
      return NextResponse.json({ error: 'Missing room parameter' }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.warn('LiveKit config missing!');
      // При локальной разработке без LiveKit вернем заглушку, чтобы интерфейс хотя бы отрендерился,
      // но реальное соединение не пройдет.
      return NextResponse.json({ error: 'LiveKit is not configured on the server.' }, { status: 503 });
    }

    // Проверяем, является ли пользователь создателем комнаты
    const { db } = await import('@/lib/db');
    const { liveSpaces } = await import('@/lib/db/schema');
    const { eq } = await import('drizzle-orm');
    
    const [space] = await db
      .select()
      .from(liveSpaces)
      .where(eq(liveSpaces.id, roomId))
      .limit(1);

    const isModerator = space?.creatorId === session.user.id;
    const isOpenMic = space?.isOpenMic === true;
    const canPublish = isModerator || isOpenMic;

    const at = new AccessToken(apiKey, apiSecret, {
      identity: session.user.id,
      name: participantName,
      metadata: JSON.stringify({
        role: isModerator ? 'moderator' : isOpenMic ? 'speaker' : 'listener',
        handRaised: false,
        isOpenMic: isOpenMic
      })
    });

    at.addGrant({ 
      roomJoin: true, 
      room: roomId,
      canPublish: canPublish,
      canSubscribe: true,
      canPublishData: true, // Нужно для поднятия руки через дата-пакеты или metadata update
    });

    const token = await at.toJwt();

    return NextResponse.json({ token });
  } catch (e) {
    console.error('[LiveKit token]', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
