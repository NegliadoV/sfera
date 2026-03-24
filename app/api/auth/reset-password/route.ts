import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { user, passwordResetToken } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { hashPassword } from '@/lib/password';

export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json();
    
    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'Не все поля заполнены' }, { status: 400 });
    }

    const userEmail = email.trim().toLowerCase();

    // Находим токен в базе
    const [tokenRecord] = await db
      .select()
      .from(passwordResetToken)
      .where(
        and(
          eq(passwordResetToken.email, userEmail),
          eq(passwordResetToken.token, code.trim())
        )
      )
      .limit(1);

    if (!tokenRecord) {
      return NextResponse.json({ error: 'Неверный код. Проверьте правильность ввода.' }, { status: 400 });
    }

    // Проверяем срок годности
    if (new Date() > new Date(tokenRecord.expires)) {
      return NextResponse.json({ error: 'Время жизни кода истекло. Запросите новый.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Новый пароль должен быть минимум 6 символов' }, { status: 400 });
    }

    // Ставим новый пароль
    const passwordHash = await hashPassword(newPassword);
    
    const [updatedUser] = await db
      .update(user)
      .set({ passwordHash })
      .where(eq(user.email, userEmail))
      .returning({ id: user.id });

    if (!updatedUser) {
        return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Удаляем использованный токен
    await db.delete(passwordResetToken).where(eq(passwordResetToken.email, userEmail));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('reset-password error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
