import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { RegisterForm } from './RegisterForm';

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
    <div className="platform-page" style={{ maxWidth: 480, margin: '0 auto', paddingTop: '48px' }}>
      <div className="platform-card">
        <h1 className="platform-hero-title" style={{ fontSize: '1.75rem', marginBottom: 8 }}>
          Регистрация
        </h1>
        <p className="platform-hero-desc mb-6">
          Создайте аккаунт по email и паролю.
        </p>

        <RegisterForm />

        <p className="mt-6 text-sm platform-card-desc">
          Уже есть аккаунт?{' '}
          <Link href="/auth/signin" className="platform-btn" style={{ display: 'inline-flex', padding: '8px 16px', fontSize: '0.9rem' }}>
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
