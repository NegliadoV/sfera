import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, directMessageConversations, directMessages } from '@/lib/db';
import { eq, and, isNull } from 'drizzle-orm';
import { notifyUser } from '@/lib/dm-notify';

export const dynamic = 'force-dynamic';

/** PATCH /api/me/conversations/[userId]/read — пометить сообщения от пользователя прочитанными */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId: otherId } = await params;
  if (!otherId || otherId === session.user.id) {
    return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
  }

  try {
    const a = session.user.id < otherId ? session.user.id : otherId;
    const b = session.user.id < otherId ? otherId : session.user.id;

    const [convo] = await db
      .select()
      .from(directMessageConversations)
      .where(and(
        eq(directMessageConversations.userIdA, a),
        eq(directMessageConversations.userIdB, b)
      ))
      .limit(1);

    if (!convo) {
      return NextResponse.json({ ok: true });
    }

    await db
      .update(directMessages)
      .set({ readAt: new Date() })
      .where(and(
        eq(directMessages.conversationId, convo.id),
        eq(directMessages.senderId, otherId),
        isNull(directMessages.readAt)
      ));

    await notifyUser(otherId, 'dm_read_receipt', { readerId: session.user.id });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('PATCH /api/me/conversations/[userId]/read', e);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}
