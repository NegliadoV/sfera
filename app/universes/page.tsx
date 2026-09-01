import { db, universes, universeTracking } from '@/lib/db';
import { desc, eq } from 'drizzle-orm';
import '@/scripts/copy-icons';
import { auth } from '@/auth';
import { UniversesHubClient } from '@/app/universes/UniversesHubClient';

export const metadata = {
  title: 'Все комнаты знаний | Roominate',
};

export const dynamic = 'force-dynamic';

export default async function UniversesHubPage() {
  let session = null;
  try {
    session = await auth();
  } catch {}

  // (no redirect to onboarding — users can browse all rooms freely)

  // Загружаем список всех комнат
  const allUniverses = await db
    .select({
      id: universes.id,
      slug: universes.slug,
      name: universes.name,
      description: universes.description,
      icon: universes.icon,
      sphereColor: universes.sphereColor,
      ownerId: universes.ownerId,
      isPrivate: universes.isPrivate,
    })
    .from(universes)
    .orderBy(desc(universes.updatedAt));

  // Загружаем отслеживаемые пользователем комнаты
  let trackedUniverseSlugs: string[] = [];
  if (session?.user?.id) {
    try {
      const trackedRows = await db
        .select({ slug: universes.slug })
        .from(universeTracking)
        .innerJoin(universes, eq(universeTracking.universeId, universes.id))
        .where(eq(universeTracking.userId, session.user.id));
      trackedUniverseSlugs = trackedRows.map((r) => r.slug);
    } catch (e) {
      console.error('Failed to load tracked universes for hub', e);
    }
  }

  return (
    <UniversesHubClient
      universes={allUniverses}
      session={session}
      trackedUniverseSlugs={trackedUniverseSlugs}
    />
  );
}
