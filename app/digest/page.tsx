import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DigestContent } from '@/components/DigestContent';

export const metadata = {
  title: 'Дайджест | Roominate',
  description: 'Ежедневный отчёт: новый контент за 24 часа в ваших сферах.',
};

export const dynamic = 'force-dynamic';

export default async function DigestPage(
  props: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
  }
) {
  const searchParams = await props.searchParams;
  if (searchParams) await searchParams;
  const session = await auth();
  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent('/digest')}`);
  }
  return (
    <div className="platform-page">
      <div className="platform-breadcrumb mb-6">
        <Link href="/">
          <i className="fa-solid fa-globe" style={{ marginRight: 4 }} /> Roominate
        </Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>Дайджест</span>
      </div>

      <div className="platform-card mb-8">
        <div className="platform-card-title" style={{ marginBottom: 8 }}>
          <i className="fa-solid fa-newspaper" aria-hidden />
          Дайджест
          <span className="platform-tag" style={{ marginLeft: 'auto' }}>За 24 часа</span>
        </div>
        <p className="platform-card-desc mb-6">
          <i className="fa-regular fa-message" style={{ marginRight: 6 }} aria-hidden />
          Новый контент за последние 24 часа в сферах, которыми вы владеете, в которых участвуете или отслеживаете.
        </p>

        <DigestContent />

        <div className="digest-schedule-info" style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
          <div className="digest-schedule-item">
            <i className="fa-regular fa-bell" aria-hidden />
            <span>
              Настройте рассылку в <Link href="/settings" style={{ color: 'var(--accent-primary-muted)', textDecoration: 'underline' }}>Настройках</Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
