import nodemailer from 'nodemailer';
import { db } from '../db';
import {
  userHygieneSettings,
  user,
  universeTracking,
  content,
  universes
} from '../db/schema';
import { eq, and, gt, inArray, desc } from 'drizzle-orm';

let mailTransporter: nodemailer.Transporter | null = null;
let isEthereal = false;

async function getTransporter() {
  if (mailTransporter) return mailTransporter;

  const smtpUrl = process.env.SMTP_URL;
  if (smtpUrl) {
    mailTransporter = nodemailer.createTransport(smtpUrl);
    return mailTransporter;
  }

  // Fallback to test ethereal account
  console.log('[Digest] Настраиваем тестовый Ethereal SMTP...');
  const testAccount = await nodemailer.createTestAccount();
  mailTransporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  isEthereal = true;
  return mailTransporter;
}

export async function sendDailyDigests() {
  console.log('[Digest] Начат процесс формирования дайджестов...');
  
  // 1. Получить пользователей с digestDelivery = 'email'
  const targetUsers = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
    })
    .from(userHygieneSettings)
    .innerJoin(user, eq(userHygieneSettings.userId, user.id))
    .where(
      and(
        eq(userHygieneSettings.digestDelivery, 'email')
      )
    );

  if (targetUsers.length === 0) {
    console.log('[Digest] Нет пользователей для рассылки дайджеста.');
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const transporter = await getTransporter();

  for (const u of targetUsers) {
    if (!u.email) continue;

    // Получаем отслеживаемые сферы
    const tracked = await db
      .select({ universeId: universeTracking.universeId })
      .from(universeTracking)
      .where(eq(universeTracking.userId, u.id));

    if (tracked.length === 0) continue;

    const universeIds = tracked.map(t => t.universeId);

    // Получаем новый контент в этих сферах за последние 24ч
    const newContent = await db
      .select({
        id: content.id,
        title: content.title,
        url: content.url,
        universeName: universes.name,
        universeSlug: universes.slug,
      })
      .from(content)
      .innerJoin(universes, eq(content.universeId, universes.id))
      .where(
        and(
          inArray(content.universeId, universeIds),
          gt(content.createdAt, yesterday)
        )
      )
      .orderBy(desc(content.createdAt));

    if (newContent.length === 0) {
      console.log(`[Digest] Нет нового контента для юзера ${u.email}`);
      continue;
    }

    // Группируем по вселенным
    const byUniverse: Record<string, { slug: string; items: typeof newContent }> = {};
    for (const item of newContent) {
      if (!byUniverse[item.universeName]) {
        byUniverse[item.universeName] = { slug: item.universeSlug, items: [] };
      }
      byUniverse[item.universeName].items.push(item);
    }

    // Рендерим HTML
    let html = `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">`;
    html += `<h2>Ваш ежедневный дайджест Ноосферы</h2>`;
    html += `<p>Привет, ${u.name ?? 'искатель'}! Вот что нового появилось в отслеживаемых вами вселенных за последние 24 часа:</p>`;
    
    for (const [uName, { slug, items }] of Object.entries(byUniverse)) {
      html += `<h3 style="color: #3b82f6; margin-top: 30px;">Вселенная: ${uName}</h3>`;
      html += `<ul style="list-style: none; padding-left: 0;">`;
      for (const item of items) {
        const itemUrl = item.url ?? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/u/${slug}/content/${item.id}`;
        html += `<li style="margin-bottom: 12px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px;">`;
        html += `<a href="${itemUrl}" style="text-decoration: none; color: #0f172a; font-weight: bold;">${item.title}</a>`;
        html += `</li>`;
      }
      html += `</ul>`;
    }

    html += `<p style="margin-top: 40px; font-size: 12px; color: #64748b;">Вы получаете это письмо, так как включили email-дайджест в настройках цифровой гигиены. Вы можете отключить его в любой момент.</p>`;
    html += `</div>`;

    const fromEmail = process.env.SMTP_FROM || '"Ноосфера Дайджест" <digest@noosphere.local>';

    try {
      const info = await transporter.sendMail({
        from: fromEmail,
        to: u.email,
        subject: `🌐 Ноосфера: Дайджест за 24 часа (${newContent.length} новых материалов)`,
        html,
      });

      console.log(`[Digest] Письмо отправлено: ${u.email}`);
      if (isEthereal) {
        console.log(`[Digest] Просмотр тестового письма: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } catch (err) {
      console.error(`[Digest] Ошибка отправки на ${u.email}:`, err);
    }
  }
}
