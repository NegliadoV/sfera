import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, comments, user } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const COMMENT_TYPES = ['thesis', 'counterargument', 'question'] as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const { contentId } = await params;
  try {
    const list = await db
      .select({
        id: comments.id,
        contentId: comments.contentId,
        authorId: comments.authorId,
        authorName: user.name,
        parentId: comments.parentId,
        type: comments.type,
        body: comments.body,
        createdAt: comments.createdAt,
      })
      .from(comments)
      .leftJoin(user, eq(comments.authorId, user.id))
      .where(eq(comments.contentId, contentId))
      .orderBy(asc(comments.createdAt));
    return NextResponse.json(list);
  } catch (e) {
    console.error('GET /api/content/[contentId]/comments', e);
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { contentId } = await params;
  try {
    const body = await req.json();
    const { parentId, type, body: text } = body as {
      parentId?: string | null;
      type?: string;
      body: string;
    };
    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Body required' }, { status: 400 });
    }
    const commentType =
      type && COMMENT_TYPES.includes(type as (typeof COMMENT_TYPES)[number])
        ? (type as (typeof COMMENT_TYPES)[number])
        : 'thesis';
    const [inserted] = await db
      .insert(comments)
      .values({
        contentId,
        authorId: session.user.id,
        parentId: parentId || null,
        type: commentType,
        body: text.trim(),
      })
      .returning();
    return NextResponse.json(inserted);
  } catch (e) {
    console.error('POST /api/content/[contentId]/comments', e);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
