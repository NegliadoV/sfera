import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { RegisterForm } from './RegisterForm';
import { SferaLogo } from '@/components/SferaLogo';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (searchParams) await searchParams;
  let session = null;
  try {
    session = await auth();
  } catch {}
  if (session?.user) redirect('/universes');

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full px-4 py-12">
      <div className="glass-panel w-full max-w-md p-6 sm:p-10 flex flex-col items-center">
        <h1 
          className="text-2xl font-bold mb-3 text-center w-full" 
          style={{ letterSpacing: '-0.02em', color: 'var(--text-primary)' }}
        >
          Регистрация
        </h1>
        <p className="text-center mb-8" style={{ color: 'var(--text-secondary)' }}>
          Создайте аккаунт, чтобы сохранять свои мысли.
        </p>

        <RegisterForm />

        <p className="mt-8 text-sm" style={{ color: 'var(--text-muted)' }}>
          Уже есть аккаунт?{' '}
          <Link href="/auth/signin" className="font-semibold transition-colors duration-200" style={{ color: 'var(--accent-primary)' }}>
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
