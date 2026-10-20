import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { db, user } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

/**
 * Вход для мобильного приложения. Общая база с веб-приложением:
 * пользователи, зарегистрированные на сайте (email/пароль), входят с теми же учётными данными.
 * JWT возвращается в ответе; cookie-сессия не используется.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const [found] = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        passwordHash: user.passwordHash,
      })
      .from(user)
      .where(eq(user.email, email.toLowerCase()))
      .limit(1);

    let target = found;
    const isDev = process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_LOGIN === 'true';

    if (!target) {
      if (email.toLowerCase() === 'seed@horizon.local') {
        if (isDev) {
          try {
            const [created] = await db
              .insert(user)
              .values({
                id: '00000000-0000-0000-0000-000000000001',
                email: 'seed@horizon.local',
                name: 'Сид-пользователь',
                userTag: 'seed_user',
              })
              .onConflictDoNothing()
              .returning();
            if (created) {
              target = { ...created, passwordHash: null };
            } else {
              const [rechecked] = await db
                .select({
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  image: user.image,
                  passwordHash: user.passwordHash,
                })
                .from(user)
                .where(eq(user.email, 'seed@horizon.local'))
                .limit(1);
              target = rechecked;
            }
          } catch {}
        }
        if (!target) {
          return NextResponse.json(
            { error: 'Seed-пользователь не найден в базе. В корне проекта выполните: npm run db:seed' },
            { status: 404 }
          );
        }
      } else {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    }

    // Dev: seed user — no password check
    if (isDev && target.email === 'seed@horizon.local') {
      const token = await createJWT(target.id);
      return NextResponse.json({
        token,
        user: {
          id: target.id,
          email: target.email,
          name: target.name,
          image: target.image,
        },
      });
    }

    if (!found.passwordHash || !password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const ok = await verifyPassword(password, found.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await createJWT(found.id);
    return NextResponse.json({
      token,
      user: {
        id: found.id,
        email: found.email,
        name: found.name,
        image: found.image,
      },
    });
  } catch (e) {
    console.error('POST /api/auth/mobile/login', e);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

async function createJWT(userId: string): Promise<string> {
  const secret = process.env.AUTH_SECRET || 'fallback-secret-change-in-production';
  const encoded = new TextEncoder().encode(secret);
  const jwt = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(encoded);
  return jwt;
}
