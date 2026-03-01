import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import {
  db,
  groupChats,
  groupChatParticipants,
  groupChatMessages,
  user,
  userHiddenGroupMessages,
} from '@/lib/db';
import { eq, and, desc, sql, isNull } from 'drizzle-orm';
import { notifyGroupMessage } from '@/lib/group-chat-notify';

export const dynamic = 'force-dynamic';

const MAX_BODY_LENGTH = 8192;

/** GET /api/me/group-chats/[groupId]/messages — сообщения группы (JWT или cookie) */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await getSessionForRequest(req);
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

    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '30', 10)));

    let rows: Array<{
      id: string;
      senderId: string;
      body: string;
      attachmentUrl: string | null;
      attachmentType: string | null;
      createdAt: Date;
      senderName: string | null;
    }>;

    const hiddenJoin = and(
      eq(userHiddenGroupMessages.messageId, groupChatMessages.id),
      eq(userHiddenGroupMessages.userId, session.user!.id)
    );
    try {
      rows = await db
        .select({
          id: groupChatMessages.id,
          senderId: groupChatMessages.senderId,
          body: groupChatMessages.body,
          attachmentUrl: groupChatMessages.attachmentUrl,
          attachmentType: groupChatMessages.attachmentType,
          createdAt: groupChatMessages.createdAt,
          senderName: user.name,
        })
        .from(groupChatMessages)
        .leftJoin(user, eq(groupChatMessages.senderId, user.id))
        .leftJoin(userHiddenGroupMessages, hiddenJoin)
        .where(and(eq(groupChatMessages.groupId, groupId), isNull(userHiddenGroupMessages.messageId)))
        .orderBy(desc(groupChatMessages.createdAt))
        .limit(limit + 1);
    } catch (e) {
      const errMsg = String((e as Error).message || '');
      if (/attachment/.test(errMsg)) {
        const base = await db
          .select({
            id: groupChatMessages.id,
            senderId: groupChatMessages.senderId,
            body: groupChatMessages.body,
            createdAt: groupChatMessages.createdAt,
            senderName: user.name,
          })
          .from(groupChatMessages)
          .leftJoin(user, eq(groupChatMessages.senderId, user.id))
          .leftJoin(userHiddenGroupMessages, hiddenJoin)
          .where(and(eq(groupChatMessages.groupId, groupId), isNull(userHiddenGroupMessages.messageId)))
          .orderBy(desc(groupChatMessages.createdAt))
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
    }));

    return NextResponse.json({
      messages: result,
      nextCursor,
    });
  } catch (e) {
    console.error('GET /api/me/group-chats/[groupId]/messages', e);
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }
}

/** POST /api/me/group-chats/[groupId]/messages — отправить сообщение (JWT или cookie) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await getSessionForRequest(req);
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

    const body = await req.json().catch(() => ({}));
    const bodyText = (body?.body as string) ?? '';
    const trimmed = typeof bodyText === 'string' ? bodyText.trim() : '';
    const attachmentUrl = (body?.attachmentUrl as string) ?? null;
    const attachmentType = (body?.attachmentType as string) ?? null;
    const attachmentName = typeof body?.attachmentName === 'string' ? body.attachmentName.trim().slice(0, 512) : null;

    if (!trimmed && !attachmentUrl) {
      return NextResponse.json({ error: 'Message body or attachment required' }, { status: 400 });
    }
    if (trimmed.length > MAX_BODY_LENGTH) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 });
    }

    const validType =
      attachmentType === 'image' || attachmentType === 'video' || attachmentType === 'audio' || attachmentType === 'file'
        ? attachmentType
        : null;
    let urlToStore: string | null = null;
    if (validType && attachmentUrl) {
      const base = String(attachmentUrl).split('?')[0].slice(0, 2048);
      urlToStore = attachmentName ? `${base}?name=${encodeURIComponent(attachmentName)}` : base;
    }

    const bodyToStore = trimmed || (validType ? '📎' : '');

    let inserted: { id: string; senderId: string; body: string; createdAt: Date; attachmentUrl?: string | null; attachmentType?: string | null };
    try {
      [inserted] = await db
        .insert(groupChatMessages)
        .values({
          groupId,
          senderId: session.user.id,
          body: bodyToStore,
          attachmentUrl: urlToStore,
          attachmentType: validType,
        })
        .returning();
    } catch (insertErr) {
      const errMsg = String((insertErr as Error).message || '');
      if (/attachment/.test(errMsg)) {
        const fallbackResult = await db.execute(
          sql`INSERT INTO group_chat_messages (group_id, sender_id, body)
              VALUES (${groupId}, ${session.user.id}, ${bodyToStore})
              RETURNING id, sender_id, body, created_at`
        );
        const fallback = (Array.isArray(fallbackResult) ? fallbackResult[0] : (fallbackResult as { rows?: unknown[] })?.rows?.[0]) as {
          id: string;
          sender_id: string;
          body: string;
          created_at: Date;
        };
        inserted = {
          id: fallback.id,
          senderId: fallback.sender_id,
          body: fallback.body,
          createdAt: fallback.created_at,
          attachmentUrl: null,
          attachmentType: null,
        };
      } else {
        throw insertErr;
      }
    }

    await db
      .update(groupChats)
      .set({ lastMessageAt: inserted.createdAt })
      .where(eq(groupChats.id, groupId));

    const participants = await db
      .select({ userId: groupChatParticipants.userId })
      .from(groupChatParticipants)
      .where(eq(groupChatParticipants.groupId, groupId));

    await notifyGroupMessage(
      participants.map((p) => p.userId),
      session.user.id,
      {
        id: inserted.id,
        groupId,
        senderId: session.user.id,
        senderName: session.user.name ?? null,
        body: inserted.body,
        attachmentUrl: inserted.attachmentUrl ?? undefined,
        attachmentType: inserted.attachmentType ?? undefined,
        createdAt: inserted.createdAt.toISOString(),
      }
    );

    return NextResponse.json({
      id: inserted.id,
      groupId,
      senderId: inserted.senderId,
      body: inserted.body,
      attachmentUrl: inserted.attachmentUrl ?? null,
      attachmentType: inserted.attachmentType ?? null,
      createdAt: inserted.createdAt.toISOString(),
    });
  } catch (e) {
    console.error('POST /api/me/group-chats/[groupId]/messages', e);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
