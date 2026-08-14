import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { user, passwordResetToken } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { hashPassword } from '@/lib/password';
import { rateLimit } from '@/lib/rate-limit';


function generateOTP() {
  // Генерация 6-значного кода с криптографически безопасным генератором
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return (100000 + (array[0] % 900000)).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 });
    }

    const userEmail = email.trim().toLowerCase();

    // ── Rate limiting ─────────────────────────────────────────────────────────
    // 3 попытки на email за 10 минут (предотвращает спам конкретному адресу)
    const byEmail = await rateLimit({ key: `fp:email:${userEmail}`, limit: 3, windowSec: 600 });
    if (!byEmail.ok) {
      return NextResponse.json(
        { error: byEmail.error },
        { status: 429, headers: { 'Retry-After': String(byEmail.resetAt - Math.floor(Date.now() / 1000)) } }
      );
    }

    // 10 попыток с одного IP за 10 минут (предотвращает перебор разных email)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown';
    const byIp = await rateLimit({ key: `fp:ip:${ip}`, limit: 10, windowSec: 600 });
    if (!byIp.ok) {
      return NextResponse.json(
        { error: byIp.error },
        { status: 429, headers: { 'Retry-After': String(byIp.resetAt - Math.floor(Date.now() / 1000)) } }
      );
    }
    // ─────────────────────────────────────────────────────────────────────────

    const [found] = await db.select().from(user).where(eq(user.email, userEmail)).limit(1);

    if (!found) {
      return NextResponse.json({ error: 'Пользователь с таким email не найден' }, { status: 404 });
    }

    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    // Хешируем OTP перед сохранением в БД (scrypt).
    // В письмо идёт сырой код, в БД — только хеш.
    const tokenHash = await hashPassword(otp);

    // Сохраняем или обновляем токен в базе
    await db.insert(passwordResetToken).values({
      email: userEmail,
      token: tokenHash,
      expires,
    }).onConflictDoUpdate({
      target: passwordResetToken.email,
      set: { token: tokenHash, expires },
    });

    // Отправляем код на почту (если настроен SMTP)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Roominate Security" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: userEmail,
        subject: 'Код для сброса пароля – Roominate',
        text: `Ваш код: ${otp}\nОн действителен 10 минут.`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #333; border-radius: 12px; background: #111; color: #fff;">
            <h2 style="margin-top: 0;">Сброс пароля в Roominate</h2>
            <p>Кто-то (надеемся, что вы) запросил сброс пароля для аккаунта <b>${userEmail}</b>.</p>
            <p>Ваш 6-значный код безопасности:</p>
            <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 36px; letter-spacing: 8px; font-weight: bold; color: #60a5fa;">${otp}</span>
            </div>
            <p style="color: #888; font-size: 14px;">Код истекает через 10 минут. Если это были не вы, просто проигнорируйте это письмо.</p>
          </div>
        `
      });
      console.log(`[AUTH] Отправлен код ${otp} на ${userEmail}`);
    } else {
      // Для DEV режима (если SMTP еще не настроен) просто логируем в консоль:
      console.log('\n=======================================');
      console.log(`🔑 [DEV MODE] OTP КОД ДЛЯ СБРОСА ПАРОЛЯ:`);
      console.log(`📧 Email: ${userEmail}`);
      console.log(`🔢 Код:   ${otp}`);
      console.log('=======================================\n');
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('forgot-password error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
