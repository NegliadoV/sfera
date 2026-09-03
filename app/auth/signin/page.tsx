import { auth, signIn } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SignInForm } from './SignInForm';
import { SferaLogo } from '@/components/SferaLogo';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; registered?: string; email?: string }>;
}) {
  let session = null;
  try {
    session = await auth();
  } catch {
    // invalid/old session cookie
  }
  if (session?.user) redirect('/universes');

  const params = await searchParams;
  const rawCallback = params?.callbackUrl;
  let callbackUrl = '/universes';
  try {
    if (rawCallback) {
      // Игнорируем базовый домен, проверяем только путь
      if (new URL(rawCallback, 'http://localhost').pathname !== '/') {
        callbackUrl = rawCallback;
      }
    }
  } catch {}

  const hasGoogleOAuth =
    Boolean(process.env.AUTH_GOOGLE_ID) && Boolean(process.env.AUTH_GOOGLE_SECRET);
  const hasGitHubOAuth =
    Boolean(process.env.AUTH_GITHUB_ID) && Boolean(process.env.AUTH_GITHUB_SECRET);
  const hasOAuth = hasGoogleOAuth || hasGitHubOAuth;

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full px-4 py-12">
      <div className="glass-panel w-full max-w-md p-6 sm:p-10 flex flex-col items-center">
        <h1 
          className="text-2xl font-bold mb-3 text-center w-full" 
          style={{ letterSpacing: '-0.02em', color: 'var(--text-primary)' }}
        >
          Вход
        </h1>
        <p className="text-center mb-8" style={{ color: 'var(--text-secondary)' }}>
          {hasOAuth
            ? 'Войдите через Google или GitHub, либо по email и паролю.'
            : 'Войдите по email и паролю или используйте dev-вход.'}
        </p>

        {hasGoogleOAuth && (
          <form
            action={async () => {
              'use server';
              await signIn('google', { redirectTo: '/universes' });
            }}
            className="w-full mb-3"
          >
            <button type="submit" className="glass-icon-btn w-full flex items-center justify-center py-3">
              <i className="fa-brands fa-google mr-3 text-lg" aria-hidden />
              <span>Войти через Google</span>
            </button>
          </form>
        )}
        {hasGitHubOAuth && (
          <form
            action={async () => {
              'use server';
              await signIn('github', { redirectTo: '/universes' });
            }}
            className="w-full mb-8"
          >
            <button type="submit" className="glass-icon-btn w-full flex items-center justify-center py-3">
              <i className="fa-brands fa-github mr-3 text-lg" aria-hidden />
              <span>Войти через GitHub</span>
            </button>
          </form>
        )}

        <SignInForm callbackUrl={callbackUrl} defaultEmail={params?.email ?? ''} />

        {params?.registered === '1' && (
          <p className="mt-4 text-sm" style={{ color: 'var(--studio-status-live-color)' }}>
            Вы зарегистрированы. Войдите с вашим email и паролем.
          </p>
        )}

        <p className="mt-8 text-sm" style={{ color: 'var(--text-muted)' }}>
          Нет аккаунта?{' '}
          <Link href="/auth/register" className="font-semibold transition-colors duration-200" style={{ color: 'var(--accent-primary)' }}>
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}
