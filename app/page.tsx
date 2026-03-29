import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function HomePage(
  props: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
  }
) {
  const searchParams = await props.searchParams;
  if (searchParams) await searchParams;

  let session = null;
  try {
    session = await auth();
    if (session?.user) {
      redirect('/explore');
    }
  } catch {}

  // If not authenticated, redirect directly to the login page (removing the landing page)
  redirect('/auth/signin');
}
