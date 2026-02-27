import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export const metadata = {
  title: 'Контакты | SFERA',
  description: 'Контакты и запросы в друзья.',
};

export const dynamic = 'force-dynamic';

export default async function ContactsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params?: Promise<Record<string, string | string[]>>;
}) {
  if (params) await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/contacts');
  }
  return <>{children}</>;
}
