import { db, universes } from '@/lib/db';
import { desc } from 'drizzle-orm';
import { UniverseCard } from '@/components/universe/UniverseCard';
import Link from 'next/link';
import '@/scripts/copy-icons';

export const metadata = {
  title: 'Все комнаты знаний | Roominate',
};

export const dynamic = 'force-dynamic';

export default async function UniversesHubPage() {
  const allUniverses = await db
    .select({
      slug: universes.slug,
      name: universes.name,
      description: universes.description,
      icon: universes.icon,
      sphereColor: universes.sphereColor,
    })
    .from(universes)
    .orderBy(desc(universes.updatedAt));

  return (
    <div className="platform-page">
      <div className="platform-breadcrumb mb-6">
        <Link href="/">
          <i className="fa-solid fa-shapes" style={{ marginRight: 4 }} /> Roominate
        </Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>Все комнаты</span>
      </div>

      <div className="platform-card mb-8">
        <div className="platform-card-title mb-4">
          <i className="fa-solid fa-shapes" aria-hidden />
          Все комнаты знаний
        </div>
        <p className="platform-card-desc mb-8">
          Здесь собраны все доступные пространства (Комнаты). Выберите интересующую вас тему, чтобы присоединиться к обсуждению.
        </p>

        {allUniverses.length === 0 ? (
          <div className="text-center p-8 text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-xl">
            Комнаты пока не созданы. Станьте первым!
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {allUniverses.map(u => (
              <UniverseCard
                key={u.slug}
                slug={u.slug}
                name={u.name}
                description={u.description}
                icon={u.icon}
                sphereColor={u.sphereColor}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
