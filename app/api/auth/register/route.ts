import { NextRequest, NextResponse } from 'next/server';
import { db, user } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

const MIN_PASSWORD_LEN = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POST /api/auth/register — регистрация по email и паролю */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password, name } = body as { email?: string; password?: string; name?: string };

    const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!emailStr) {
      return NextResponse.json({ error: 'Укажите email' }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(emailStr)) {
      return NextResponse.json({ error: 'Некорректный email' }, { status: 400 });
    }

    const passwordStr = typeof password === 'string' ? password : '';
    if (passwordStr.length < MIN_PASSWORD_LEN) {
      return NextResponse.json(
        { error: `Пароль не менее ${MIN_PASSWORD_LEN} символов` },
        { status: 400 }
      );
    }

    const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, emailStr)).limit(1);
    if (existing) {
      return NextResponse.json({ error: 'Пользователь с таким email уже зарегистрирован' }, { status: 409 });
    }

    const passwordHash = await hashPassword(passwordStr);
    const [newUser] = await db
      .insert(user)
      .values({
        email: emailStr,
        name: typeof name === 'string' && name.trim() ? name.trim() : emailStr.split('@')[0],
        passwordHash,
      })
      .returning({ id: user.id, email: user.email, name: user.name });

    return NextResponse.json({
      ok: true,
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
    });
  } catch (e) {
    console.error('POST /api/auth/register', e);
    return NextResponse.json({ error: 'Ошибка регистрации' }, { status: 500 });
  }
}
