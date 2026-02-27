import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, userSources, userContent } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [source] = await db
      .select()
      .from(userSources)
      .where(and(eq(userSources.id, id), eq(userSources.userId, session.user.id!)))
      .limit(1);

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    return NextResponse.json(source);
  } catch (e) {
    console.error('GET /api/me/sources/[id]', e);
    return NextResponse.json({ error: 'Failed to load source' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { enabled, name, url, config } = body as {
      enabled?: boolean;
      name?: string;
      url?: string;
      config?: Record<string, unknown>;
    };

    const [source] = await db
      .select()
      .from(userSources)
      .where(and(eq(userSources.id, id), eq(userSources.userId, session.user.id!)))
      .limit(1);

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    const updateData: {
      enabled?: boolean;
      name?: string;
      url?: string | null;
      config?: Record<string, unknown> | null;
    } = {};

    if (enabled !== undefined) updateData.enabled = enabled;
    if (name !== undefined) updateData.name = name.trim();
    if (url !== undefined) updateData.url = url?.trim() || null;
    if (config !== undefined) updateData.config = config || null;

    const [updated] = await db
      .update(userSources)
      .set(updateData)
      .where(eq(userSources.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (e) {
    console.error('PATCH /api/me/sources/[id]', e);
    return NextResponse.json({ error: 'Failed to update source' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [source] = await db
      .select()
      .from(userSources)
      .where(and(eq(userSources.id, id), eq(userSources.userId, session.user.id!)))
      .limit(1);

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    await db.delete(userContent).where(eq(userContent.sourceId, id));
    await db.delete(userSources).where(eq(userSources.id, id));

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/me/sources/[id]', e);
    return NextResponse.json({ error: 'Failed to delete source' }, { status: 500 });
  }
}
