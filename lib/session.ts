import { jwtVerify, SignJWT } from 'jose';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { db, user } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { versionCache, SESSION_VERSION_CACHE_TTL } from '@/lib/session-version';

export type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

export type SessionForRequest = {
  user: SessionUser;
  expires?: string;
};

/** Get session from Bearer token or from cookies (auth/mobile-sync). */
export async function getSessionForRequest(req: NextRequest): Promise<SessionForRequest | null> {
  const authHeader = req.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    token = req.cookies.get('sfera-mobile-token')?.value || null;
  }

  if (token) {
    try {
      if (!process.env.AUTH_SECRET) throw new Error('AUTH_SECRET is not set');
      const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
      const { payload } = await jwtVerify(token, secret);
      const userId = payload.sub as string | undefined;
      if (!userId) return null;

      const [found] = await db
        .select({ id: user.id, email: user.email, name: user.name, image: user.image, sessionVersion: user.sessionVersion })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (!found) return null;

      // Проверяем sessionVersion — если пользователь вызвал revoke-sessions,
      // Bearer-токен с устаревшей версией должен быть отклонён.
      const tokenSv = typeof payload.sv === 'number' ? payload.sv : null;
      if (tokenSv !== null) {
        // Используем кэш как в auth.ts (TTL = 5 сек)
        const cached = versionCache.get(userId);
        const dbVersion = (cached && Date.now() - cached.fetchedAt < SESSION_VERSION_CACHE_TTL)
          ? cached.version
          : (() => {
              // Кэш протух или отсутствует — обновляем из только что полученных данных
              versionCache.set(userId, { version: found.sessionVersion, fetchedAt: Date.now() });
              return found.sessionVersion;
            })();

        if (dbVersion !== tokenSv) {
          return null; // Сессия инвалидирована — revoke-sessions сработал
        }
      }

      return {
        user: {
          id: found.id,
          email: found.email,
          name: found.name,
          image: found.image,
        },
      };
    } catch {
      return null;
    }
  }

  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? undefined,
      name: session.user.name ?? undefined,
      image: session.user.image ?? undefined,
    },
    expires: session.expires,
  };
}

/** Get session consistently inside Server Components using standard auth or synced mobile auth. */
export async function getSessionForServerComponent(): Promise<SessionForRequest | null> {
  const session = await auth();
  if (session?.user?.id) {
    return {
      user: {
        id: session.user.id,
        email: session.user.email ?? undefined,
        name: session.user.name ?? undefined,
        image: session.user.image ?? undefined,
      },
      expires: session.expires,
    };
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sfera-mobile-token')?.value;
    if (token) {
      if (!process.env.AUTH_SECRET) throw new Error('AUTH_SECRET is not set');
      const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
      const { payload } = await jwtVerify(token, secret);
      const userId = payload.sub as string | undefined;
      if (!userId) return null;

      const [found] = await db
        .select({ id: user.id, email: user.email, name: user.name, image: user.image })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (found) {
        return {
          user: {
            id: found.id,
            email: found.email,
            name: found.name,
            image: found.image,
          },
        };
      }
    }
  } catch (e) {
    // Ignore decoding errors
  }

  return null;
}
