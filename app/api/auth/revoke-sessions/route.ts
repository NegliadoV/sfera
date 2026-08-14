import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { bumpSessionVersion } from '@/lib/session-version';

/**
 * POST /api/auth/revoke-sessions
 *
 * Инкрементирует sessionVersion для текущего пользователя.
 * Все его JWT-токены на других устройствах станут невалидными
 * при следующей проверке (максимум через 5 сек).
 *
 * Используется в настройках аккаунта → "Выйти со всех устройств".
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  await bumpSessionVersion(session.user.id);

  return NextResponse.json({ ok: true });
}
