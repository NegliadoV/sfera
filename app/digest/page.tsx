import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DigestPageClient } from './DigestPageClient';

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
  return <DigestPageClient />;
}
