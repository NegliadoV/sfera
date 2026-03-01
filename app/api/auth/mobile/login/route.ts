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

    if (!found) {
      if (email === 'seed@horizon.local') {
        return NextResponse.json(
          { error: 'Seed-пользователь не найден в базе. В корне проекта выполните: npm run db:seed' },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Dev: seed user — no password check
    if (found.email === 'seed@horizon.local') {
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
