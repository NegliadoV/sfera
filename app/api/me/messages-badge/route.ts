import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import {
  db,
  directMessageConversations,
  directMessages,
  contactRequests,
} from '@/lib/db';
import { eq, or, and, sql, isNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** GET /api/me/messages-badge — счётчик непрочитанных DM и входящих запросов в друзья */
export async function GET(req: NextRequest) {
  const session = await getSessionForRequest(req);
  const me = session?.user?.id;
  if (!me) {
    return NextResponse.json({ unreadDmCount: 0, pendingContactRequests: 0 }, { status: 200 });
  }

  try {
    // Непрочитанные DM: сообщения, где получатель = я, отправитель != я, readAt = null
    const unreadDmRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(directMessages)
      .innerJoin(directMessageConversations, eq(directMessages.conversationId, directMessageConversations.id))
      .where(
        and(
          or(
            eq(directMessageConversations.userIdA, me),
            eq(directMessageConversations.userIdB, me)
          ),
          sql`${directMessages.senderId} != ${me}`,
          isNull(directMessages.readAt)
        )
      );

    const unreadDmCount = unreadDmRows[0]?.count ?? 0;

    // Входящие запросы в друзья (pending)
    const pendingRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(contactRequests)
      .where(
        and(
          eq(contactRequests.toUserId, me),
          eq(contactRequests.status, 'pending')
        )
      );

    const pendingContactRequests = pendingRows[0]?.count ?? 0;

    return NextResponse.json({
      unreadDmCount: Number(unreadDmCount),
      pendingContactRequests: Number(pendingContactRequests),
      total: Number(unreadDmCount) + Number(pendingContactRequests),
    });
  } catch (e) {
    console.error('GET /api/me/messages-badge', e);
    return NextResponse.json({ unreadDmCount: 0, pendingContactRequests: 0, total: 0 }, { status: 200 });
  }
}
