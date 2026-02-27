import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, comments } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const COMMENT_TYPES = ['thesis', 'counterargument', 'question'] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ contentId: string; commentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { contentId, commentId } = await params;
  try {
    const body = await req.json();
    const { type, body: text } = body as { type?: string; body?: string };
    const updates: { type?: (typeof COMMENT_TYPES)[number]; body?: string; updatedAt?: Date } = {
      updatedAt: new Date(),
    };
    if (type && COMMENT_TYPES.includes(type as (typeof COMMENT_TYPES)[number])) {
      updates.type = type as (typeof COMMENT_TYPES)[number];
    }
    if (typeof text === 'string' && text.trim()) updates.body = text.trim();
    const [updated] = await db
      .update(comments)
      .set(updates)
      .where(and(eq(comments.id, commentId), eq(comments.contentId, contentId), eq(comments.authorId, session.user.id)))
      .returning();
    if (!updated) {
      return NextResponse.json({ error: 'Comment not found or forbidden' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (e) {
    console.error('PATCH comment', e);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ contentId: string; commentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { contentId, commentId } = await params;
  try {
    const [deleted] = await db
      .delete(comments)
      .where(and(eq(comments.id, commentId), eq(comments.contentId, contentId), eq(comments.authorId, session.user.id)))
      .returning({ id: comments.id });
    if (!deleted) {
      return NextResponse.json({ error: 'Comment not found or forbidden' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE comment', e);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
