import { jwtVerify, SignJWT } from 'jose';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { db, user } from '@/lib/db';
import { eq } from 'drizzle-orm';

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

/** Get session from Bearer token or from cookies (auth). */
export async function getSessionForRequest(req: NextRequest): Promise<SessionForRequest | null> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    try {
      const secret = new TextEncoder().encode(
        process.env.AUTH_SECRET || 'fallback-secret-change-in-production'
      );
      const { payload } = await jwtVerify(token, secret);
      const userId = payload.sub as string | undefined;
      if (!userId) return null;

      const [found] = await db
        .select({ id: user.id, email: user.email, name: user.name, image: user.image })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (!found) return null;
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
