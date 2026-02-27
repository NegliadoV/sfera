import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, directMessages, userHiddenDmMessages } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { getOrCreateConversation } from '@/lib/dm-utils';

export const dynamic = 'force-dynamic';

/** POST /api/me/conversations/[userId]/messages/[messageId]/hide — скрыть сообщение у себя */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string; messageId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId: peerUserId, messageId } = await params;
  if (!peerUserId || !messageId) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  try {
    const conversationId = await getOrCreateConversation(session.user.id, peerUserId);

    const [msg] = await db
      .select({ id: directMessages.id })
      .from(directMessages)
      .where(
        and(
          eq(directMessages.id, messageId),
          eq(directMessages.conversationId, conversationId)
        )
      )
      .limit(1);

    if (!msg) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    await db
      .insert(userHiddenDmMessages)
      .values({ userId: session.user.id, messageId })
      .onConflictDoNothing({ target: [userHiddenDmMessages.userId, userHiddenDmMessages.messageId] });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/me/conversations/[userId]/messages/[messageId]/hide', e);
    return NextResponse.json({ error: 'Failed to hide message' }, { status: 500 });
  }
}
