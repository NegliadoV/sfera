import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { user, passwordResetToken } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '@/lib/password';
import { rateLimit } from '@/lib/rate-limit';
import { invalidateSessionVersionCache } from '@/lib/session-version';



export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json();
    
    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'Не все поля заполнены' }, { status: 400 });
    }

    const userEmail = email.trim().toLowerCase();

    // 5 попыток ввода кода за 15 мин — защита от brute-force 6-значного OTP
    const rl = await rateLimit({ key: `rp:${userEmail}`, limit: 5, windowSec: 900 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: rl.error },
        { status: 429, headers: { 'Retry-After': String(rl.resetAt - Math.floor(Date.now() / 1000)) } }
      );
    }

    // Находим запись по email и проверяем хеш кода
    const [tokenRecord] = await db
      .select()
      .from(passwordResetToken)
      .where(eq(passwordResetToken.email, userEmail))
      .limit(1);

    if (!tokenRecord) {
      return NextResponse.json({ error: 'Неверный код. Проверьте правильность ввода.' }, { status: 400 });
    }

    // Проверяем хеш кода (защита от timing attacks)
    const isCodeValid = await verifyPassword(code.trim(), tokenRecord.token);
    if (!isCodeValid) {
      return NextResponse.json({ error: 'Неверный код. Проверьте правильность ввода.' }, { status: 400 });
    }

    // Проверяем срок годности
    if (new Date() > new Date(tokenRecord.expires)) {
      return NextResponse.json({ error: 'Время жизни кода истекло. Запросите новый.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Новый пароль должен быть минимум 6 символов' }, { status: 400 });
    }

    // Ставим новый пароль И инкрементируем sessionVersion — все старые JWT станут невалидными
    const passwordHash = await hashPassword(newPassword);
    
    const [updatedUser] = await db
      .update(user)
      .set({
        passwordHash,
        sessionVersion: sql`${user.sessionVersion} + 1`,
      })
      .where(eq(user.email, userEmail))
      .returning({ id: user.id });

    if (!updatedUser) {
        return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Сбрасываем кэш версий чтобы auth.ts сразу увидел новую версию
    invalidateSessionVersionCache(updatedUser.id);

    // Удаляем использованный токен
    await db.delete(passwordResetToken).where(eq(passwordResetToken.email, userEmail));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('reset-password error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
