import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import {
  db,
  directMessageConversations,
  directMessages,
  user,
  userBlocks,
} from '@/lib/db';
import { eq, or, and, desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** GET /api/me/conversations — список диалогов с последним сообщением */
export async function GET(req: NextRequest) {
  const session = await getSessionForRequest(req);
  const me = session?.user?.id;
  if (!me) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const convos = await db
      .select()
      .from(directMessageConversations)
      .where(or(
        eq(directMessageConversations.userIdA, me),
        eq(directMessageConversations.userIdB, me)
      ));

    const blocked = await db
      .select({ blockedId: userBlocks.blockedId })
      .from(userBlocks)
      .where(eq(userBlocks.blockerId, me));
    const blockedSet = new Set(blocked.map((b) => b.blockedId));

    const result = await Promise.all(
      convos.map(async (c) => {
        const otherId = c.userIdA === me ? c.userIdB : c.userIdA;
        if (blockedSet.has(otherId)) {
          return null;
        }

        const [lastMsg] = await db
          .select()
          .from(directMessages)
          .where(eq(directMessages.conversationId, c.id))
          .orderBy(desc(directMessages.createdAt))
          .limit(1);

        const [otherUser] = await db
          .select({ id: user.id, name: user.name, image: user.image })
          .from(user)
          .where(eq(user.id, otherId))
          .limit(1);

        return {
          userId: otherId,
          userName: otherUser?.name ?? null,
          userImage: otherUser?.image ?? null,
          lastMessage: lastMsg
            ? {
                id: lastMsg.id,
                senderId: lastMsg.senderId,
                body: lastMsg.body,
                createdAt: lastMsg.createdAt.toISOString(),
                readAt: lastMsg.readAt?.toISOString() ?? null,
              }
            : null,
          lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
        };
      })
    );

    const filtered = result.filter(Boolean) as NonNullable<(typeof result)[number]>[];
    filtered.sort((a, b) => {
      const ta = a.lastMessageAt ?? a.lastMessage?.createdAt ?? '';
      const tb = b.lastMessageAt ?? b.lastMessage?.createdAt ?? '';
      return tb.localeCompare(ta);
    });

    return NextResponse.json(filtered);
  } catch (e) {
    console.error('GET /api/me/conversations', e);
    return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 });
  }
}
