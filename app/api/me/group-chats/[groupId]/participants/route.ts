import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, groupChatParticipants, groupChats, user } from '@/lib/db';
import { eq, and, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** POST /api/me/group-chats/[groupId]/participants — добавить участников */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { groupId } = await params;
  if (!groupId) {
    return NextResponse.json({ error: 'Invalid groupId' }, { status: 400 });
  }

  try {
    const [group] = await db.select().from(groupChats).where(eq(groupChats.id, groupId)).limit(1);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const [member] = await db
      .select()
      .from(groupChatParticipants)
      .where(and(
        eq(groupChatParticipants.groupId, groupId),
        eq(groupChatParticipants.userId, session.user!.id)
      ))
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const userIds = Array.isArray(body?.userIds) ? body.userIds : [];

    const uniqueIds = [...new Set(userIds)].filter(
      (id): id is string => typeof id === 'string' && id !== session.user!.id
    );
    if (uniqueIds.length === 0) {
      return NextResponse.json({ error: 'Add at least one user' }, { status: 400 });
    }

    const existing = await db
      .select({ userId: groupChatParticipants.userId })
      .from(groupChatParticipants)
      .where(eq(groupChatParticipants.groupId, groupId));
    const existingSet = new Set(existing.map((e) => e.userId));
    const toAdd = uniqueIds.filter((id) => !existingSet.has(id));

    if (toAdd.length === 0) {
      return NextResponse.json({ added: [], message: 'All users already in group' });
    }

    const validUsers = await db
      .select({ id: user.id })
      .from(user)
      .where(inArray(user.id, toAdd));
    const validIds = validUsers.map((u) => u.id);

    await db.insert(groupChatParticipants).values(
      validIds.map((userId) => ({ groupId, userId }))
    );

    const added = await db
      .select({ id: user.id, name: user.name, image: user.image })
      .from(user)
      .where(inArray(user.id, validIds));

    return NextResponse.json({
      added: added.map((u) => ({
        userId: u.id,
        name: u.name ?? null,
        image: u.image ?? null,
      })),
    });
  } catch (e) {
    console.error('POST /api/me/group-chats/[groupId]/participants', e);
    return NextResponse.json({ error: 'Failed to add participants' }, { status: 500 });
  }
}
