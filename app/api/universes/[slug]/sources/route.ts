import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, sources, universes, universeMembers } from '@/lib/db';
import { eq, and, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    // Получаем вселенную
    const [universe] = await db
      .select()
      .from(universes)
      .where(eq(universes.slug, slug))
      .limit(1);

    if (!universe) {
      return NextResponse.json({ error: 'Universe not found' }, { status: 404 });
    }

    // Получаем источники вселенной
    const universeSources = await db
      .select()
      .from(sources)
      .where(eq(sources.universeId, universe.id))
      .orderBy(asc(sources.createdAt));

    return NextResponse.json(universeSources);
  } catch (e) {
    console.error('GET /api/universes/[slug]/sources', e);
    return NextResponse.json({ error: 'Failed to load sources' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { provider, name, url, config, enabled } = body as {
      provider: 'rss' | 'youtube' | 'podcast' | 'telegram' | 'manual';
      name: string;
      url?: string;
      config?: Record<string, unknown>;
      enabled?: boolean;
    };

    // Получаем вселенную
    const [universe] = await db
      .select()
      .from(universes)
      .where(eq(universes.slug, slug))
      .limit(1);

    if (!universe) {
      return NextResponse.json({ error: 'Universe not found' }, { status: 404 });
    }

    // Проверяем права (только владелец или модератор)
    const [membership] = await db
      .select()
      .from(universeMembers)
      .where(
        and(
          eq(universeMembers.universeId, universe.id),
          eq(universeMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (!membership && universe.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Добавлять источники могут только владелец и модераторы сферы. Создайте свою сферу на странице «Сферы».' },
        { status: 403 }
      );
    }

    if (membership && membership.role === 'member') {
      return NextResponse.json(
        { error: 'Добавлять источники могут только владелец и модераторы сферы.' },
        { status: 403 }
      );
    }

    if (!name || !provider) {
      return NextResponse.json({ error: 'name and provider required' }, { status: 400 });
    }

    const [inserted] = await db
      .insert(sources)
      .values({
        universeId: universe.id,
        provider,
        name: name.trim(),
        url: url?.trim() || null,
        config: config || null,
        enabled: enabled !== undefined ? enabled : true,
      })
      .returning();

    return NextResponse.json(inserted);
  } catch (e) {
    console.error('POST /api/universes/[slug]/sources', e);
    return NextResponse.json({ error: 'Failed to create source' }, { status: 500 });
  }
}
