import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import {
  db,
  groupChats,
  groupChatParticipants,
  groupChatMessages,
  user,
} from '@/lib/db';
import { eq, inArray, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** POST /api/me/group-chats — создать групповой чат */
export async function POST(req: NextRequest) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const name = (body?.name as string)?.trim?.() ?? '';
    const participantIds = Array.isArray(body?.participantIds) ? body.participantIds : [];

    if (!name || name.length > 128) {
      return NextResponse.json({ error: 'Invalid group name (1–128 chars)' }, { status: 400 });
    }

    const uniqueIds = [...new Set(participantIds)].filter(
      (id): id is string => typeof id === 'string' && id !== session.user!.id
    );
    if (uniqueIds.length === 0) {
      return NextResponse.json({ error: 'Add at least one participant' }, { status: 400 });
    }

    const [inserted] = await db
      .insert(groupChats)
      .values({ name, createdById: session.user.id })
      .returning();

    const allUserIds = [session.user.id, ...uniqueIds];
    await db.insert(groupChatParticipants).values(
      allUserIds.map((userId) => ({
        groupId: inserted!.id,
        userId,
      }))
    );

    const participants = await db
      .select({ id: user.id, name: user.name, image: user.image })
      .from(user)
      .where(inArray(user.id, allUserIds));

    return NextResponse.json({
      id: inserted!.id,
      name: inserted!.name,
      createdById: inserted!.createdById,
      participants: participants.map((p) => ({
        userId: p.id,
        name: p.name ?? null,
        image: p.image ?? null,
      })),
      lastMessageAt: null,
      createdAt: inserted!.createdAt.toISOString(),
    });
  } catch (e) {
    console.error('POST /api/me/group-chats', e);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}

/** GET /api/me/group-chats — список групповых чатов пользователя */
export async function GET(req: NextRequest) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const myGroups = await db
      .select({ groupId: groupChatParticipants.groupId })
      .from(groupChatParticipants)
      .where(eq(groupChatParticipants.userId, session.user!.id));

    if (myGroups.length === 0) {
      return NextResponse.json([]);
    }

    const groupIds = myGroups.map((g) => g.groupId);
    const groups = await db
      .select()
      .from(groupChats)
      .where(inArray(groupChats.id, groupIds));

    const result = await Promise.all(
      groups.map(async (g) => {
        const [lastMsg] = await db
          .select()
          .from(groupChatMessages)
          .where(eq(groupChatMessages.groupId, g.id))
          .orderBy(desc(groupChatMessages.createdAt))
          .limit(1);

        const participantRows = await db
          .select({
            userId: groupChatParticipants.userId,
            name: user.name,
            image: user.image,
          })
          .from(groupChatParticipants)
          .leftJoin(user, eq(groupChatParticipants.userId, user.id))
          .where(eq(groupChatParticipants.groupId, g.id));

        return {
          id: g.id,
          name: g.name,
          createdById: g.createdById,
          participants: participantRows.map((p) => ({
            userId: p.userId,
            name: p.name ?? null,
            image: p.image ?? null,
          })),
          lastMessage: lastMsg
            ? {
                id: lastMsg.id,
                senderId: lastMsg.senderId,
                body: lastMsg.body,
                createdAt: lastMsg.createdAt.toISOString(),
              }
            : null,
          lastMessageAt: g.lastMessageAt?.toISOString() ?? null,
        };
      })
    );

    result.sort((a, b) => {
      const ta = a.lastMessageAt ?? a.lastMessage?.createdAt ?? '';
      const tb = b.lastMessageAt ?? b.lastMessage?.createdAt ?? '';
      return tb.localeCompare(ta);
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error('GET /api/me/group-chats', e);
    return NextResponse.json({ error: 'Failed to load groups' }, { status: 500 });
  }
}
