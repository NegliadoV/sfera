import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, groupChatMessages, groupChatParticipants } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** DELETE /api/me/group-chats/[groupId]/messages/[messageId] — удалить своё сообщение в группе */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string; messageId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { groupId, messageId } = await params;
  if (!groupId || !messageId) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  try {
    const [member] = await db
      .select()
      .from(groupChatParticipants)
      .where(
        and(
          eq(groupChatParticipants.groupId, groupId),
          eq(groupChatParticipants.userId, session.user!.id)
        )
      )
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    const [msg] = await db
      .select({ id: groupChatMessages.id, senderId: groupChatMessages.senderId })
      .from(groupChatMessages)
      .where(
        and(
          eq(groupChatMessages.id, messageId),
          eq(groupChatMessages.groupId, groupId)
        )
      )
      .limit(1);

    if (!msg) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    if (msg.senderId !== session.user.id) {
      return NextResponse.json({ error: 'Can only delete your own messages' }, { status: 403 });
    }

    await db.delete(groupChatMessages).where(eq(groupChatMessages.id, messageId));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/me/group-chats/[groupId]/messages/[messageId]', e);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
