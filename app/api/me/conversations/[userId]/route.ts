import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import {
  db,
  directMessageConversations,
  directMessages,
  user,
  userBlocks,
  userHiddenDmMessages,
} from '@/lib/db';
import { eq, and, desc, isNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** GET /api/me/conversations/[userId] — сообщения с пользователем (JWT или cookie) */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = await params;
  if (!userId || userId === session.user.id) {
    return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
  }

  try {
    const [blockedByThem] = await db
      .select()
      .from(userBlocks)
      .where(and(
        eq(userBlocks.blockerId, userId),
        eq(userBlocks.blockedId, session.user.id)
      ))
      .limit(1);
    if (blockedByThem) {
      return NextResponse.json({ error: 'Conversation not available' }, { status: 403 });
    }

    const a = session.user.id < userId ? session.user.id : userId;
    const b = session.user.id < userId ? userId : session.user.id;

    const [convo] = await db
      .select()
      .from(directMessageConversations)
      .where(and(
        eq(directMessageConversations.userIdA, a),
        eq(directMessageConversations.userIdB, b)
      ))
      .limit(1);

    if (!convo) {
      return NextResponse.json({ messages: [], otherUser: null });
    }

    const [otherUserRow] = await db
      .select({ name: user.name, image: user.image })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '30', 10)));

    let rows: Array<{
      id: string;
      senderId: string;
      body: string;
      attachmentUrl: string | null;
      attachmentType: string | null;
      createdAt: Date;
      readAt: Date | null;
      senderName: string | null;
    }>;
    const hiddenJoin = and(
      eq(userHiddenDmMessages.messageId, directMessages.id),
      eq(userHiddenDmMessages.userId, session.user.id)
    );
    try {
      rows = await db
        .select({
          id: directMessages.id,
          senderId: directMessages.senderId,
          body: directMessages.body,
          attachmentUrl: directMessages.attachmentUrl,
          attachmentType: directMessages.attachmentType,
          createdAt: directMessages.createdAt,
          readAt: directMessages.readAt,
          senderName: user.name,
        })
        .from(directMessages)
        .leftJoin(user, eq(directMessages.senderId, user.id))
        .leftJoin(userHiddenDmMessages, hiddenJoin)
        .where(and(eq(directMessages.conversationId, convo.id), isNull(userHiddenDmMessages.messageId)))
        .orderBy(desc(directMessages.createdAt))
        .limit(limit + 1);
    } catch (e) {
      const errMsg = String((e as Error).message || '');
      if (/attachment_(url|type)/.test(errMsg)) {
        const base = await db
          .select({
            id: directMessages.id,
            senderId: directMessages.senderId,
            body: directMessages.body,
            createdAt: directMessages.createdAt,
            readAt: directMessages.readAt,
            senderName: user.name,
          })
          .from(directMessages)
          .leftJoin(user, eq(directMessages.senderId, user.id))
          .leftJoin(userHiddenDmMessages, hiddenJoin)
          .where(and(eq(directMessages.conversationId, convo.id), isNull(userHiddenDmMessages.messageId)))
          .orderBy(desc(directMessages.createdAt))
          .limit(limit + 1);
        rows = base.map((m) => ({ ...m, attachmentUrl: null, attachmentType: null }));
      } else {
        throw e;
      }
    }

    let nextCursor: string | null = null;
    let messages = rows;
    if (rows.length > limit) {
      messages = rows.slice(0, limit);
      nextCursor = rows[limit - 1]!.createdAt.toISOString();
    }

    const result = messages.reverse().map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.senderName ?? null,
      body: m.body,
      attachmentUrl: m.attachmentUrl ?? null,
      attachmentType: m.attachmentType ?? null,
      createdAt: m.createdAt.toISOString(),
      readAt: m.readAt?.toISOString() ?? null,
    }));

    return NextResponse.json({
      messages: result,
      nextCursor,
      otherUser: otherUserRow
        ? { name: otherUserRow.name ?? null, image: otherUserRow.image ?? null }
        : null,
    });
  } catch (e) {
    console.error('GET /api/me/conversations/[userId]', e);
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }
}
