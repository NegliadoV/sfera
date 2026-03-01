import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, directMessages, directMessageConversations, user } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import { getOrCreateConversation, canSendDm } from '@/lib/dm-utils';
import { notifyUser } from '@/lib/dm-notify';

export const dynamic = 'force-dynamic';

const MAX_BODY_LENGTH = 8192; // 8 KB

/** POST /api/me/conversations/[userId]/messages — отправить сообщение (JWT или cookie) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId: recipientId } = await params;
  if (!recipientId || recipientId === session.user.id) {
    return NextResponse.json({ error: 'Invalid recipient' }, { status: 400 });
  }

  try {
    const canSend = await canSendDm(session.user.id, recipientId);
    if (!canSend.ok) {
      if (canSend.reason === 'blocked') {
        return NextResponse.json({ error: 'Cannot send: blocked' }, { status: 403 });
      }
      if (canSend.reason === 'contacts_only') {
        return NextResponse.json({ error: 'User accepts messages only from contacts' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Cannot send message' }, { status: 403 });
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
      urlToStore = attachmentName
        ? `${base}?name=${encodeURIComponent(attachmentName)}`
        : base;
    }

    const [recipient] = await db
      .select()
      .from(user)
      .where(eq(user.id, recipientId))
      .limit(1);
    if (!recipient) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const conversationId = await getOrCreateConversation(session.user.id, recipientId);

    const bodyToStore = trimmed || (validType ? '📎' : '');
    let inserted: { id: string; senderId: string; body: string; createdAt: Date; attachmentUrl?: string | null; attachmentType?: string | null };
    try {
      [inserted] = await db
        .insert(directMessages)
        .values({
          conversationId,
          senderId: session.user.id,
          body: bodyToStore,
          attachmentUrl: urlToStore,
          attachmentType: validType,
        })
        .returning();
    } catch (insertErr) {
      const errMsg = String((insertErr as Error).message || '');
      if (/attachment_(url|type)/.test(errMsg)) {
        const fallbackResult = await db.execute(
          sql`INSERT INTO direct_messages (conversation_id, sender_id, body)
              VALUES (${conversationId}, ${session.user.id}, ${bodyToStore})
              RETURNING id, sender_id, body, created_at, read_at`
        );
        const fallback = (Array.isArray(fallbackResult) ? fallbackResult[0] : (fallbackResult as { rows?: unknown[] })?.rows?.[0]) as { id: string; sender_id: string; body: string; created_at: Date; read_at: Date | null };
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
      .update(directMessageConversations)
      .set({ lastMessageAt: inserted.createdAt })
      .where(eq(directMessageConversations.id, conversationId));

    await notifyUser(recipientId, 'dm_new_message', {
      id: inserted.id,
      conversationId,
      senderId: session.user.id,
      senderName: session.user.name ?? null,
      body: inserted.body,
      attachmentUrl: inserted.attachmentUrl ?? undefined,
      attachmentType: inserted.attachmentType ?? undefined,
      createdAt: inserted.createdAt.toISOString(),
    });

    return NextResponse.json({
      id: inserted.id,
      conversationId,
      senderId: inserted.senderId,
      body: inserted.body,
      attachmentUrl: inserted.attachmentUrl ?? null,
      attachmentType: inserted.attachmentType ?? null,
      createdAt: inserted.createdAt.toISOString(),
      readAt: null,
    });
  } catch (e) {
    console.error('POST /api/me/conversations/[userId]/messages', e);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
