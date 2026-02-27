import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, contentLinks, content } from '@/lib/db';
import { eq, and, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const { contentId } = await params;

  try {
    // Получаем все связи для контента (входящие и исходящие)
    const links = await db
      .select()
      .from(contentLinks)
      .where(
        or(
          eq(contentLinks.fromContentId, contentId),
          eq(contentLinks.toContentId, contentId)
        )
      );

    return NextResponse.json(links);
  } catch (e) {
    console.error('GET /api/content/[contentId]/links', e);
    return NextResponse.json({ error: 'Failed to load links' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const { contentId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { toContentId, linkType, note } = body as {
      toContentId: string;
      linkType: 'contradicts' | 'develops' | 'related';
      note?: string;
    };

    if (!toContentId || !linkType) {
      return NextResponse.json({ error: 'toContentId and linkType required' }, { status: 400 });
    }

    // Проверяем, что оба контента существуют
    const [fromContent] = await db
      .select()
      .from(content)
      .where(eq(content.id, contentId))
      .limit(1);

    const [toContent] = await db
      .select()
      .from(content)
      .where(eq(content.id, toContentId))
      .limit(1);

    if (!fromContent || !toContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Проверяем, не существует ли уже такая связь
    const [existing] = await db
      .select()
      .from(contentLinks)
      .where(
        and(
          eq(contentLinks.fromContentId, contentId),
          eq(contentLinks.toContentId, toContentId),
          eq(contentLinks.linkType, linkType)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: 'Link already exists' }, { status: 409 });
    }

    const [inserted] = await db
      .insert(contentLinks)
      .values({
        fromContentId: contentId,
        toContentId: toContentId,
        linkType: linkType,
        createdById: session.user.id,
        note: note?.trim() || null,
      })
      .returning();

    return NextResponse.json(inserted);
  } catch (e) {
    console.error('POST /api/content/[contentId]/links', e);
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 });
  }
}
