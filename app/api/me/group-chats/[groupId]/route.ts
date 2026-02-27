import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  db,
  groupChats,
  groupChatParticipants,
  user,
} from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** GET /api/me/group-chats/[groupId] — информация о группе и участниках */
export async function GET(
  _req: NextRequest,
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

    const [group] = await db
      .select()
      .from(groupChats)
      .where(eq(groupChats.id, groupId))
      .limit(1);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const participantRows = await db
      .select({
        userId: groupChatParticipants.userId,
        name: user.name,
        image: user.image,
      })
      .from(groupChatParticipants)
      .leftJoin(user, eq(groupChatParticipants.userId, user.id))
      .where(eq(groupChatParticipants.groupId, groupId));

    return NextResponse.json({
      id: group.id,
      name: group.name,
      createdById: group.createdById,
      participants: participantRows.map((p) => ({
        userId: p.userId,
        name: p.name ?? null,
        image: p.image ?? null,
      })),
      lastMessageAt: group.lastMessageAt?.toISOString() ?? null,
    });
  } catch (e) {
    console.error('GET /api/me/group-chats/[groupId]', e);
    return NextResponse.json({ error: 'Failed to load group' }, { status: 500 });
  }
}
