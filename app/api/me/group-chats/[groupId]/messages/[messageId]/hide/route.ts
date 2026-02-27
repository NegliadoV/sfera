import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, groupChatMessages, groupChatParticipants, userHiddenGroupMessages } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** POST /api/me/group-chats/[groupId]/messages/[messageId]/hide — скрыть сообщение у себя */
export async function POST(
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
      .select({ id: groupChatMessages.id })
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

    await db
      .insert(userHiddenGroupMessages)
      .values({ userId: session.user.id, messageId })
      .onConflictDoNothing({ target: [userHiddenGroupMessages.userId, userHiddenGroupMessages.messageId] });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/me/group-chats/[groupId]/messages/[messageId]/hide', e);
    return NextResponse.json({ error: 'Failed to hide message' }, { status: 500 });
  }
}
