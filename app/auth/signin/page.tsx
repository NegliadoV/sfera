import { auth, signIn } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SignInForm } from './SignInForm';

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
  const callbackUrl = params?.callbackUrl ?? '/';
  const hasGoogleOAuth =
    Boolean(process.env.AUTH_GOOGLE_ID) && Boolean(process.env.AUTH_GOOGLE_SECRET);

  return (
    <div className="platform-page" style={{ maxWidth: 480, margin: '0 auto', paddingTop: '48px' }}>
      <div className="platform-card">
        <h1 className="platform-hero-title" style={{ fontSize: '1.75rem', marginBottom: 8 }}>
          Вход в Ноосферу
        </h1>
        <p className="platform-hero-desc mb-6">
          {hasGoogleOAuth
            ? 'Войдите через Google или по email и паролю.'
            : 'Войдите по email и паролю или используйте dev-вход.'}
        </p>

        {hasGoogleOAuth && (
          <form
            action={async () => {
              'use server';
              await signIn('google', { redirectTo: '/universes' });
            }}
            className="mb-6"
            target="_top"
          >
            <button type="submit" className="platform-btn platform-btn-primary w-full justify-center">
              <i className="fa-brands fa-google" aria-hidden />
              Войти через Google
            </button>
          </form>
        )}

        <SignInForm callbackUrl={callbackUrl} defaultEmail={params?.email ?? ''} />

        {params?.registered === '1' && (
          <p className="mt-4 text-sm" style={{ color: 'var(--studio-status-live-color)' }}>
            Вы зарегистрированы. Войдите с вашим email и паролем.
          </p>
        )}

        <p className="mt-6 text-sm platform-card-desc">
          Нет аккаунта?{' '}
          <Link href="/auth/register" className="platform-btn" style={{ display: 'inline-flex', padding: '8px 16px', fontSize: '0.9rem' }}>
            Зарегистрироваться
          </Link>
        </p>

        <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--studio-panel-border)' }}>
          <p className="platform-section-heading mb-3">Dev: вход как seed-пользователь</p>
          <form
            action={async () => {
              'use server';
              await signIn('credentials', {
                email: 'seed@horizon.local',
                password: 'dev',
                redirectTo: callbackUrl,
              });
            }}
          >
            <button type="submit" className="platform-btn w-full justify-center">
              Войти как seed-пользователь
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
