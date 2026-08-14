import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db, universes } from '@/lib/db';
import { desc } from 'drizzle-orm';
import { OnboardingWizard } from './OnboardingWizard';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Добро пожаловать | Roominate',
};

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');

  const allUniverses = await db
    .select({
      slug: universes.slug,
      name: universes.name,
      icon: universes.icon,
      sphereColor: universes.sphereColor,
      description: universes.description,
    })
    .from(universes)
    .orderBy(desc(universes.updatedAt))
    .limit(24);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <OnboardingWizard universes={allUniverses} />
    </div>
  );
}
