import { NextRequest, NextResponse } from 'next/server';
import { db, user } from '@/lib/db';
import { verificationToken } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '@/lib/password';
import { normalizeAndValidateUserTag } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';


export const dynamic = 'force-dynamic';

const MIN_PASSWORD_LEN = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register — регистрация по email и паролю.
 * Обязательно указывается ник (@ник) — латиница, цифры, подчёркивание, 3–30 символов.
 * Общая база: один и тот же эндпоинт используют и веб, и мобильное приложение.
 */
export async function POST(req: NextRequest) {
  try {
    // 5 регистраций с одного IP за 1 час — защита от массового создания аккаунтов
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown';
    const rl = await rateLimit({ key: `reg:ip:${ip}`, limit: 5, windowSec: 3600 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: rl.error },
        { status: 429, headers: { 'Retry-After': String(rl.resetAt - Math.floor(Date.now() / 1000)) } }
      );
    }

    const body = await req.json().catch(() => ({}));

    const { email, password, name, userTag: rawUserTag } = body as {
      email?: string;
      password?: string;
      name?: string;
      userTag?: string;
    };

    const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!emailStr) {
      return NextResponse.json({ error: 'Укажите email' }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(emailStr)) {
      return NextResponse.json({ error: 'Некорректный email' }, { status: 400 });
    }

    const validatedTag = normalizeAndValidateUserTag(rawUserTag);
    if (!validatedTag) {
      return NextResponse.json(
        { error: 'Укажите ник: латиница, цифры или подчёркивание, от 3 до 30 символов (например: mynick или my_nick)' },
        { status: 400 }
      );
    }

    const passwordStr = typeof password === 'string' ? password : '';
    if (passwordStr.length < MIN_PASSWORD_LEN) {
      return NextResponse.json(
        { error: `Пароль не менее ${MIN_PASSWORD_LEN} символов` },
        { status: 400 }
      );
    }

    const [existingEmail] = await db.select({ id: user.id }).from(user).where(eq(user.email, emailStr)).limit(1);
    if (existingEmail) {
      return NextResponse.json({ error: 'Пользователь с таким email уже зарегистрирован' }, { status: 409 });
    }

    const [existingTag] = await db.select({ id: user.id }).from(user).where(eq(user.userTag, validatedTag)).limit(1);
    if (existingTag) {
      return NextResponse.json({ error: 'Такой ник уже занят. Выберите другой.' }, { status: 409 });
    }

    const verificationCode = typeof body.code === 'string' ? body.code.trim() : '';
    if (!verificationCode) {
      return NextResponse.json({ error: 'Введите проверочный код из Email' }, { status: 400 });
    }

    // Проверяем 6-значный код в базе (хэш сравнение через scrypt)
    const [tokenRecord] = await db
      .select()
      .from(verificationToken)
      .where(eq(verificationToken.identifier, emailStr))
      .limit(1);

    if (!tokenRecord) {
      return NextResponse.json({ error: 'Неверный или устаревший код подтверждения' }, { status: 400 });
    }

    const isCodeValid = await verifyPassword(verificationCode, tokenRecord.token);
    if (!isCodeValid) {
      return NextResponse.json({ error: 'Неверный или устаревший код подтверждения' }, { status: 400 });
    }
    if (new Date() > new Date(tokenRecord.expires)) {
      return NextResponse.json({ error: 'Код истёк. Запросите код заново' }, { status: 400 });
    }

    // Код верный! Идем дальше.
    // Удаляем использованный токен
    await db.delete(verificationToken).where(eq(verificationToken.identifier, emailStr));

    const passwordHash = await hashPassword(passwordStr);
    const [newUser] = await db
      .insert(user)
      .values({
        email: emailStr,
        name: typeof name === 'string' && name.trim() ? name.trim() : emailStr.split('@')[0],
        passwordHash,
        userTag: validatedTag,
      })
      .returning({ id: user.id, email: user.email, name: user.name, userTag: user.userTag });

    return NextResponse.json({
      ok: true,
      user: { id: newUser.id, email: newUser.email, name: newUser.name, userTag: newUser.userTag },
    });
  } catch (e) {
    console.error('POST /api/auth/register', e);
    return NextResponse.json({ error: 'Ошибка регистрации' }, { status: 500 });
  }
}
