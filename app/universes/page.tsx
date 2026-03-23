import { db, universes } from '@/lib/db';
import { desc } from 'drizzle-orm';
import { UniverseCard } from '@/components/universe/UniverseCard';
import Link from 'next/link';

export const metadata = {
  title: 'Все сферы знаний | SFERA',
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
          <i className="fa-solid fa-globe" style={{ marginRight: 4 }} /> SFERA
        </Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>Все сферы</span>
      </div>

      <div className="platform-card mb-8">
        <div className="platform-card-title mb-4">
          <i className="fa-solid fa-compass" aria-hidden />
          Все сферы знаний
        </div>
        <p className="platform-card-desc mb-8">
          Здесь собраны все доступные пространства (Сферы). Выберите интересующую вас тему, чтобы присоединиться к обсуждению.
        </p>

        {allUniverses.length === 0 ? (
          <div className="text-center p-8 text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-xl">
            Сферы пока не созданы. Станьте первым!
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
