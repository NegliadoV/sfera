import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  db,
  directMessageConversations,
  directMessages,
  userBlocks,
} from '@/lib/db';
import { eq, or, and, sql, isNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/me/conversations/unread-counts
 * Returns unread message count per contact: { [userId]: number }
 * Used to show notification badges next to contacts in the sidebar.
 */
export async function GET() {
  const session = await auth();
  const me = session?.user?.id;
  if (!me) {
    return NextResponse.json({}, { status: 200 });
  }

  try {
    const blocked = await db
      .select({ blockedId: userBlocks.blockedId })
      .from(userBlocks)
      .where(eq(userBlocks.blockerId, me));
    const blockedSet = new Set(blocked.map((b) => b.blockedId));

    const rows = await db
      .select({
        senderId: directMessages.senderId,
        count: sql<number>`count(*)::int`,
      })
      .from(directMessages)
      .innerJoin(
        directMessageConversations,
        eq(directMessages.conversationId, directMessageConversations.id)
      )
      .where(
        and(
          or(
            eq(directMessageConversations.userIdA, me),
            eq(directMessageConversations.userIdB, me)
          ),
          sql`${directMessages.senderId} != ${me}`,
          isNull(directMessages.readAt)
        )
      )
      .groupBy(directMessages.senderId);

    const result: Record<string, number> = {};
    for (const row of rows) {
      if (row.senderId && !blockedSet.has(row.senderId)) {
        result[row.senderId] = Number(row.count) || 0;
      }
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error('GET /api/me/conversations/unread-counts', e);
    return NextResponse.json({}, { status: 200 });
  }
}
