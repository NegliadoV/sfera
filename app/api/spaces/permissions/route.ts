import { NextRequest, NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';
import { getSessionForRequest } from '@/lib/session';
import { db } from '@/lib/db';
import { liveSpaces } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionForRequest(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId, participantIdentity, action } = await req.json();

    if (!roomId || !participantIdentity || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    let livekitUrl = process.env.LIVEKIT_API_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json({ error: 'LiveKit is not configured' }, { status: 503 });
    }

    // RoomServiceClient requires HTTP/HTTPS URL
    if (livekitUrl.startsWith('ws://')) {
      livekitUrl = livekitUrl.replace('ws://', 'http://');
    } else if (livekitUrl.startsWith('wss://')) {
      livekitUrl = livekitUrl.replace('wss://', 'https://');
    }

    // Verify creator check
    const [space] = await db.select().from(liveSpaces).where(eq(liveSpaces.id, roomId)).limit(1);
    
    // Only the creator can grant/revoke microphone, OR anyone can revoke their own microphone
    const isCreator = space?.creatorId === session.user.id;
    const isSelf = participantIdentity === session.user.id;

    if (!isCreator && !isSelf) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);

    // Get the participant to read their current metadata
    const participant = await roomService.getParticipant(roomId, participantIdentity);
    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    let meta: any = {};
    try {
      meta = JSON.parse(participant.metadata || '{}');
    } catch(e) {}

    const permission: any = participant.permission || { canSubscribe: true, canPublishData: true };
    
    let finalCanPublish = permission.canPublish;
    if (action === 'hand_toggle') {
      meta.handRaised = !meta.handRaised;
    } else {
      finalCanPublish = action === 'grant';
      permission.canPublish = finalCanPublish;
      meta = {
        ...meta,
        role: finalCanPublish ? (isCreator ? 'moderator' : 'speaker') : 'listener',
        handRaised: finalCanPublish ? false : Boolean(meta.handRaised)
      };
    }

    await roomService.updateParticipant(roomId, participantIdentity, JSON.stringify(meta), permission);

    return NextResponse.json({ success: true, canPublish: finalCanPublish });
  } catch (e: any) {
    console.error('[LiveKit permissions update]', e.message || e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
