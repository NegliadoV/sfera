import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import { user, account, session, verificationToken } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '@/lib/password';

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

        // Dev: seed-пользователь — вход без пароля
        if (found.email === 'seed@horizon.local') {
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
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.sub ?? session.user.id;
      return session;
    },
    redirect({ url, baseUrl }) {
      // Если редирект не указан явно, направляем на страницу вселенных
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/universes`;
      }
      // Если URL относительный, добавляем baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Если URL из того же домена, возвращаем как есть
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // В остальных случаях редиректим на вселенные
      return `${baseUrl}/universes`;
    },
  },
  trustHost: true,
});
