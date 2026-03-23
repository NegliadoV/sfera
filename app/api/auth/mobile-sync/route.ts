import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db, user } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const redirectUrl = req.nextUrl.searchParams.get('redirect') || '/';

  if (!token) {
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.AUTH_SECRET || 'fallback-secret-change-in-production'
    );
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.sub as string | undefined;

    if (userId) {
      // Validate user exists
      const [found] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (found) {
        // Set a custom secure http-only cookie for the mobile webview
        const cookieStore = await cookies();
        cookieStore.set('sfera-mobile-token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/',
        });
      }
    }
  } catch (e) {
    console.error('Mobile sync failed:', e);
  }

  return NextResponse.redirect(new URL(redirectUrl, req.url));
}
