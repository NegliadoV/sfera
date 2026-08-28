import { NextResponse } from 'next/server';
import { getSessionForRequest, SessionUser } from '@/lib/session';
import { NextRequest } from 'next/server';

type AuthenticatedHandler<T = unknown> = (
  req: NextRequest,
  context: T,
  sessionUser: SessionUser
) => Promise<NextResponse | Response>;

/**
 * Higher-order function to enforce session authentication on Next.js API route handlers.
 * Eliminates repetitive `const session = await auth(); if (!session?.user?.id)...` checks across routes.
 */
export function requireAuth<T = unknown>(handler: AuthenticatedHandler<T>) {
  return async (req: NextRequest, context: T): Promise<NextResponse | Response> => {
    const session = await getSessionForRequest(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Вы должны войти в систему' }, { status: 401 });
    }
    return handler(req, context, session.user);
  };
}
