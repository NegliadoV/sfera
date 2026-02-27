import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, directMessages, directMessageConversations } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { getOrCreateConversation } from '@/lib/dm-utils';

export const dynamic = 'force-dynamic';

/** DELETE /api/me/conversations/[userId]/messages/[messageId] — удалить своё сообщение в личке */
export async function DELETE(
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
      .select({ id: directMessages.id, senderId: directMessages.senderId })
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
    if (msg.senderId !== session.user.id) {
      return NextResponse.json({ error: 'Can only delete your own messages' }, { status: 403 });
    }

    await db.delete(directMessages).where(eq(directMessages.id, messageId));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/me/conversations/[userId]/messages/[messageId]', e);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
