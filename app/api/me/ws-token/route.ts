import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { createWsToken } from '@/lib/ws-token';

export const dynamic = 'force-dynamic';

/** GET /api/me/ws-token — короткоживущий токен для WebSocket (аутентификация). */
export async function GET(req: NextRequest) {
  const session = await getSessionForRequest(req);
  const me = session?.user?.id;
  if (!me) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = createWsToken(me);
  return NextResponse.json({ token });
}
