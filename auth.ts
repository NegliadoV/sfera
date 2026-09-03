import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Facebook from 'next-auth/providers/facebook';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import { user, account, session, verificationToken } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '@/lib/password';
import { versionCache, SESSION_VERSION_CACHE_TTL } from '@/lib/session-version';

async function getDbSessionVersion(userId: string): Promise<number | null> {
  const cached = versionCache.get(userId);
  if (cached && Date.now() - cached.fetchedAt < SESSION_VERSION_CACHE_TTL) {
    return cached.version;
  }
  try {
    const [row] = await db
      .select({ sessionVersion: user.sessionVersion })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    if (!row) return null;
    versionCache.set(userId, { version: row.sessionVersion, fetchedAt: Date.now() });
    return row.sessionVersion;
  } catch {
    return null; // Ошибка БД — пропускаем (грацефул деградейшн)
  }
}


const hasGoogleOAuth =
  process.env.AUTH_GOOGLE_ID != null &&
  process.env.AUTH_GOOGLE_ID !== '' &&
  process.env.AUTH_GOOGLE_SECRET != null &&
  process.env.AUTH_GOOGLE_SECRET !== '';

const hasGitHubOAuth =
  process.env.AUTH_GITHUB_ID != null &&
  process.env.AUTH_GITHUB_ID !== '' &&
  process.env.AUTH_GITHUB_SECRET != null &&
  process.env.AUTH_GITHUB_SECRET !== '';

const hasFacebookOAuth =
  process.env.AUTH_FACEBOOK_ID != null &&
  process.env.AUTH_FACEBOOK_ID !== '' &&
  process.env.AUTH_FACEBOOK_SECRET != null &&
  process.env.AUTH_FACEBOOK_SECRET !== '';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: user,
    accountsTable: account,
    sessionsTable: session,
    verificationTokensTable: verificationToken,
  }),
  providers: [
    ...(hasGoogleOAuth
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(hasGitHubOAuth
      ? [
          GitHub({
            clientId: process.env.AUTH_GITHUB_ID!,
            clientSecret: process.env.AUTH_GITHUB_SECRET!,
          }),
        ]
      : []),
    ...(hasFacebookOAuth
      ? [
          Facebook({
            clientId: process.env.AUTH_FACEBOOK_ID!,
            clientSecret: process.env.AUTH_FACEBOOK_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email?.trim()) return null;

        const [found] = await db
          .select({ id: user.id, email: user.email, name: user.name, image: user.image, passwordHash: user.passwordHash })
          .from(user)
          .where(eq(user.email, email.trim().toLowerCase()))
          .limit(1);

        if (!found) return null;

        // Dev: seed-пользователь — вход без пароля (только в dev-окружении)
        if (process.env.NODE_ENV !== 'production' && found.email === 'seed@horizon.local') {
          return { id: found.id, email: found.email, name: found.name, image: found.image };
        }

        // Вход по email: проверка пароля
        if (!found.passwordHash) return null;
        if (!password) return null;
        const ok = await verifyPassword(password, found.passwordHash);
        if (!ok) return null;

        return { id: found.id, email: found.email, name: found.name, image: found.image };
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user: u, trigger }) {
      // При логине — записываем userId и версию в токен
      if (u?.id) {
        token.sub = u.id;
        const version = await getDbSessionVersion(u.id);
        token.sv = version ?? 0; // sv = sessionVersion
      }

      // При каждом обновлении JWT — проверяем версию в БД
      if (token.sub && typeof token.sv === 'number') {
        const currentVersion = await getDbSessionVersion(token.sub);
        // currentVersion === null: ошибка БД — пропускаем
        if (currentVersion !== null && currentVersion !== token.sv) {
          // Версия устарела — инвалидируем сессию
          return null as any;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.sub ?? session.user.id;
      return session;
    },
    redirect({ url, baseUrl }) {
      let target = '/universes';
      try {
        if (url.startsWith('/')) {
          target = url;
        } else {
          const parsed = new URL(url, baseUrl);
          if (parsed.origin === new URL(baseUrl).origin) {
            target = parsed.pathname + parsed.search + parsed.hash;
          }
        }
      } catch (e) {}

      if (target === '/' || target === '') {
        target = '/universes';
      }

      try {
        const fullUrl = new URL(target, baseUrl).toString();
        return encodeURI(fullUrl);
      } catch (e) {
        return `${baseUrl}/universes`;
      }
    },
  },
  trustHost: true,
});
