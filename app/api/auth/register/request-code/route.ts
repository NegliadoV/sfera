import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { user, verificationToken } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { normalizeAndValidateUserTag } from '@/lib/validation';

export const dynamic = 'force-dynamic';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email, userTag } = await req.json();

    if (!email || !userTag) {
      return NextResponse.json({ error: 'Email и Ник обязательны' }, { status: 400 });
    }

    const emailStr = email.trim().toLowerCase();
    const validatedTag = normalizeAndValidateUserTag(userTag);

    if (!validatedTag) {
      return NextResponse.json({ error: 'Некорректный ник' }, { status: 400 });
    }

    // 1. Проверяем, не занят ли Email
    const [existingEmail] = await db.select({ id: user.id }).from(user).where(eq(user.email, emailStr)).limit(1);
    if (existingEmail) {
      return NextResponse.json({ error: 'Пользователь с таким email уже зарегистрирован' }, { status: 409 });
    }

    // 2. Проверяем, не занят ли Ник
    const [existingTag] = await db.select({ id: user.id }).from(user).where(eq(user.userTag, validatedTag)).limit(1);
    if (existingTag) {
      return NextResponse.json({ error: 'Такой ник уже занят. Выберите другой.' }, { status: 409 });
    }

    // 3. Генерируем код и сохраняем в verificationToken
    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    // Удаляем старые коды для этого email перед генерацией нового
    await db.delete(verificationToken).where(eq(verificationToken.identifier, emailStr));

    await db.insert(verificationToken).values({
      identifier: emailStr,
      token: otp,
      expires,
    });

    // 4. Отправляем письмо
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
        from: `"Roominate" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: emailStr,
        subject: 'Код подтверждения регистрации – Roominate',
        text: `Ваш код: ${otp}\nОн действителен 10 минут.`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #333; border-radius: 12px; background: #111; color: #fff;">
            <h2 style="margin-top: 0;">Регистрация в Ноосфере</h2>
            <p>Вы начали регистрацию аккаунта <b>${emailStr}</b>.</p>
            <p>Ваш 6-значный код подтверждения:</p>
            <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 36px; letter-spacing: 8px; font-weight: bold; color: #60a5fa;">${otp}</span>
            </div>
            <p style="color: #888; font-size: 14px;">Код истекает через 10 минут.</p>
          </div>
        `
      });
      console.log(`[AUTH] Отправлен код ${otp} на ${emailStr} для регистрации`);
    } else {
      console.log('\n=======================================');
      console.log(`🔑 [DEV MODE] OTP КОД ДЛЯ РЕГИСТРАЦИИ:`);
      console.log(`📧 Email: ${emailStr}`);
      console.log(`🔢 Код:   ${otp}`);
      console.log('=======================================\n');
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('request-code error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
