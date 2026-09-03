'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Client-side auth guard hook.
 * Redirects to /auth/signin if the user is not authenticated.
 * Returns { session, status, isReady } — isReady is true when auth check is complete and user is authenticated.
 */
export function useAuthGuard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin');
    }
  }, [status, router]);

  return {
    session,
    status,
    isReady: status === 'authenticated' && !!session?.user,
  };
}
