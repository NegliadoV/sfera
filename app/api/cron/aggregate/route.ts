import { NextRequest, NextResponse } from 'next/server';
import { aggregateUserSync, getUserIdsWithEnabledSources } from '@/lib/aggregator/user-functions';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * Крон-эндпоинт для автоматической агрегации постов из источников (Telegram, RSS и т.д.).
 * Вызывается по расписанию (Vercel Cron, cron-job.org и т.п.).
 *
 * Безопасность: проверяет заголовок Authorization: Bearer <CRON_SECRET>.
 * Задайте CRON_SECRET в .env (минимум 16 символов).
 *
 * Vercel Cron: добавляет CRON_SECRET автоматически.
 * Внешний cron (cron-job.org): укажите Bearer-токен в заголовках.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd && (!cronSecret || cronSecret.length < 16)) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userIds = await getUserIdsWithEnabledSources();
    let totalProcessed = 0;

    for (const userId of userIds) {
      try {
        const result = await aggregateUserSync(userId);
        totalProcessed += result.processed;
      } catch (err) {
        console.error(`[Cron] Ошибка агрегации для пользователя ${userId}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      users: userIds.length,
      processed: totalProcessed,
    });
  } catch (e) {
    console.error('[Cron] aggregate:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Vercel Cron и некоторые сервисы отправляют POST
export async function POST(req: NextRequest) {
  return GET(req);
}
