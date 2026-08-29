import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { SettingsPageClient } from './SettingsPageClient';

export const metadata = {
  title: 'Настройки | Roominate',
  description: 'Внешний вид и цифровая гигиена.',
};

export const dynamic = 'force-dynamic';

export default async function SettingsPage(
  props: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
  }
) {
  const searchParams = await props.searchParams;
  if (searchParams) await searchParams;
  const session = await auth();
  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent('/settings')}`);
  }
  return <SettingsPageClient />;
}
