import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, user } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { normalizeAndValidateUserTag } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/** GET /api/me/user-tag — текущий тег пользователя */
export async function GET(req: NextRequest) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = String(session.user.id);

  try {
    const [row] = await db
      .select({ userTag: user.userTag })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    return NextResponse.json({ userTag: row?.userTag ?? null });
  } catch (e) {
    const errMsg = String((e as Error).message || '');
    if (/user_tag/.test(errMsg)) {
      return NextResponse.json({ userTag: null });
    }
    console.error('GET /api/me/user-tag', e);
    return NextResponse.json({ error: 'Failed to load user tag' }, { status: 500 });
  }
}

/** PATCH /api/me/user-tag — установка/обновление тега */
export async function PATCH(req: NextRequest) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = String(session.user.id);

  try {
    const body = await req.json().catch(() => ({}));
    const rawTag = body?.userTag as string | undefined;

    const trimmed = typeof rawTag === 'string' ? rawTag.trim().replace(/^@+/, '') : '';
    if (trimmed === '') {
      try {
        const cleared = await db
          .update(user)
          .set({ userTag: null })
          .where(eq(user.id, userId))
          .returning({ id: user.id });
        if (cleared.length === 0) {
          return NextResponse.json(
            { error: 'Пользователь не найден в базе. Попробуйте выйти и войти заново.' },
            { status: 404 }
          );
        }
      } catch (updErr) {
        if (/user_tag/.test(String((updErr as Error).message || ''))) {
          return NextResponse.json(
            { error: 'Колонка user_tag не найдена. Запустите: npm run db:add-user-tag' },
            { status: 503 }
          );
        }
        throw updErr;
      }
      return NextResponse.json({ userTag: null });
    }

    const validatedTag = normalizeAndValidateUserTag(rawTag);
    if (!validatedTag) {
      return NextResponse.json(
        { error: 'Invalid tag. Use 3–30 characters: letters, numbers, underscore.' },
        { status: 400 }
      );
    }

    try {
      const [existing] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.userTag, validatedTag))
        .limit(1);
      if (existing && String(existing.id) !== userId) {
        return NextResponse.json({ error: 'This tag is already taken' }, { status: 409 });
      }

      const updated = await db
        .update(user)
        .set({ userTag: validatedTag })
        .where(eq(user.id, userId))
        .returning({ id: user.id });

      if (updated.length === 0) {
        return NextResponse.json(
          { error: 'Пользователь не найден в базе. Попробуйте выйти и войти заново.' },
          { status: 404 }
        );
      }

      return NextResponse.json({ userTag: validatedTag });
    } catch (updErr) {
      const err = updErr as { code?: string; cause?: { code?: string }; message?: string };
      const code = err?.code ?? err?.cause?.code;
      const errMsg = String(err?.message || '');
      if (code === '23505') {
        return NextResponse.json({ error: 'This tag is already taken' }, { status: 409 });
      }
      if (/user_tag/.test(errMsg)) {
        return NextResponse.json(
          { error: 'Колонка user_tag не найдена. Запустите: npm run db:add-user-tag' },
          { status: 503 }
        );
      }
      throw updErr;
    }
  } catch (e) {
    console.error('PATCH /api/me/user-tag', e);
    return NextResponse.json({ error: 'Failed to save user tag' }, { status: 500 });
  }
}
