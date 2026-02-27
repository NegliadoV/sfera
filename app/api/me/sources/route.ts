import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, userSources } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const list = await db
      .select()
      .from(userSources)
      .where(eq(userSources.userId, session.user.id))
      .orderBy(asc(userSources.createdAt));

    return NextResponse.json(list);
  } catch (e) {
    console.error('GET /api/me/sources', e);
    return NextResponse.json({ error: 'Failed to load sources' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { provider, name, url, config, enabled } = body as {
      provider?: 'rss' | 'youtube' | 'podcast' | 'telegram' | 'manual';
      name: string;
      url?: string;
      config?: Record<string, unknown>;
      enabled?: boolean;
    };

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }

    const validProvider = provider && ['rss', 'youtube', 'podcast', 'telegram', 'manual'].includes(provider)
      ? provider
      : 'rss';

    const [inserted] = await db
      .insert(userSources)
      .values({
        userId: session.user.id,
        provider: validProvider,
        name: name.trim(),
        url: url?.trim() || null,
        config: config || null,
        enabled: enabled !== undefined ? enabled : true,
      })
      .returning();

    return NextResponse.json(inserted);
  } catch (e) {
    console.error('POST /api/me/sources', e);
    return NextResponse.json({ error: 'Failed to create source' }, { status: 500 });
  }
}
