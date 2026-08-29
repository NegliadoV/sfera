import { db, universes, universeTracking } from '@/lib/db';
import { desc, eq, sql } from 'drizzle-orm';
import '@/scripts/copy-icons';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
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

  // Новый пользователь без подписок — показываем онбординг
  if (session?.user?.id) {
    try {
      const [trackCount] = (await db.execute(
        sql`SELECT COUNT(*)::int as cnt FROM universe_tracking WHERE user_id = ${session.user.id}`
      )) as unknown as [{ cnt: number }];
      if (!trackCount || trackCount.cnt === 0) {
        redirect('/onboarding');
      }
    } catch {}
  }

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
