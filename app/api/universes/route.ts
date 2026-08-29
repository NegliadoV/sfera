import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSessionForRequest } from '@/lib/session';
import { db, universes, universeMembers, user } from '@/lib/db';
import { desc, eq } from 'drizzle-orm';
import { normalizeIconForStorage } from '@/lib/utils/icons';
import { getRandomSphereColorIndex } from '@/lib/sphere-colors';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await db
      .select({
        id: universes.id,
        slug: universes.slug,
        name: universes.name,
        description: universes.description,
        icon: universes.icon,
        sphereColor: universes.sphereColor,
        isPrivate: universes.isPrivate,
        monthlyPrice: universes.monthlyPrice,
        ownerId: universes.ownerId,
        createdAt: universes.createdAt,
      })
      .from(universes)
      .orderBy(desc(universes.createdAt));
    return NextResponse.json(list);
  } catch (e) {
    console.error('GET /api/universes', e);
    return NextResponse.json(
      { error: 'Database unavailable' },
      { status: 503 }
    );
  }
}

import { validateUniverseCreation } from '@/lib/moderation/moderator-bot';

export async function POST(req: NextRequest) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const [owner] = await db.select({ id: user.id }).from(user).where(eq(user.id, session.user.id)).limit(1);
    if (!owner) {
      return NextResponse.json(
        { error: 'User not found in database. Please sign out and sign in again.' },
        { status: 401 }
      );
    }
    const body = await req.json();
    const { slug, name, description, icon, isPrivate, monthlyPrice } = body as { slug?: string; name?: string; description?: string; icon?: string, isPrivate?: boolean, monthlyPrice?: number | null };
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }

    // 🤖 Проверка Бот-модератором перед созданием сферы
    const moderation = validateUniverseCreation({
      name: name.trim(),
      description: typeof description === 'string' ? description.trim() : null,
      slug: typeof slug === 'string' ? slug.trim() : null,
    });

    if (!moderation.isAllowed) {
      return NextResponse.json(
        {
          error: moderation.reasonRu,
          botMessage: moderation.botFeedback,
          category: moderation.category,
        },
        { status: 400 }
      );
    }

    const rawSlug = (typeof slug === 'string' && slug.trim()) ? slug.trim() : name.trim();
    const s = rawSlug.toLowerCase().replace(/\s+/g, '-');
    const [existing] = await db.select().from(universes).where(eq(universes.slug, s));
    if (existing) {
      return NextResponse.json(
        { error: 'Universe with this slug already exists', slug: existing.slug },
        { status: 409 }
      );
    }
    // Нормализуем иконку перед сохранением
    const normalizedIcon = typeof icon === 'string' ? normalizeIconForStorage(icon) : null;
    
    const [inserted] = await db
      .insert(universes)
      .values({
        slug: s,
        name: name.trim(),
        description: typeof description === 'string' ? description.trim() : null,
        icon: normalizedIcon,
        sphereColor: String(getRandomSphereColorIndex()),
        ownerId: session.user.id,
        isPrivate: Boolean(isPrivate),
        monthlyPrice: typeof monthlyPrice === 'number' ? monthlyPrice : null,
      })
      .returning();
    if (!inserted) {
      return NextResponse.json({ error: 'Failed to create universe' }, { status: 500 });
    }
    await db.insert(universeMembers).values({
      universeId: inserted.id,
      userId: session.user.id,
      role: 'owner',
    });
    revalidatePath('/universes');
    revalidatePath(`/universes/${inserted.slug}`);
    return NextResponse.json(inserted);
  } catch (e) {
    console.error('POST /api/universes', e);
    return NextResponse.json({ error: 'Failed to create universe' }, { status: 500 });
  }
}
