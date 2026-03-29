import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import Link from 'next/link';

export const metadata = {
  title: 'Сообщения | Roominate',
  description: 'Личные сообщения.',
};

export const dynamic = 'force-dynamic';

export default async function MessagesLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params?: Promise<Record<string, string | string[]>>;
}) {
  if (params) await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/messages');
  }
  return (
    <div
      className="platform-page platform-page-messages"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100dvh - 140px)',
        maxHeight: 'calc(100dvh - 140px)',
        width: '100%',
        maxWidth: '100%',
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <div className="platform-breadcrumb mb-6" style={{ flexShrink: 0 }}>
        <Link href="/">
          <i className="fa-solid fa-globe" style={{ marginRight: 4 }} /> Roominate
        </Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <Link href="/messages" style={{ color: 'var(--text-secondary)' }}>Сообщения</Link>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, width: '100%', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}
