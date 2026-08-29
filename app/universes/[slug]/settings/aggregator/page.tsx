import { notFound } from 'next/navigation';
import { getSessionForServerComponent } from '@/lib/session';
import { db, universes } from '@/lib/db';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { normalizeUniverseSlug } from '@/lib/universe-slug';

export const dynamic = 'force-dynamic';

export default async function AggregatorSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = normalizeUniverseSlug((await params).slug);
  if (!slug) notFound();

  const session = await getSessionForServerComponent();

  let universe;
  try {
    const [u] = await db.select().from(universes).where(eq(universes.slug, slug)).limit(1);
    universe = u;
  } catch {
    notFound();
  }

  if (!universe) notFound();

  return (
    <div className="platform-page">
      <div className="platform-breadcrumb mb-6">
        <Link href="/rooms">Комнаты</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <Link href={`/universes/${slug}`}>{universe.name}</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>Источники</span>
      </div>

      <div className="platform-card mb-8">
        <h1 className="platform-hero-title" style={{ fontSize: '1.75rem', marginBottom: 12 }}>
          Агрегация контента
        </h1>
        <p className="platform-card-desc mb-6">
          Агрегация контента перенесена в персональный раздел <strong>Сборка</strong>. Добавляйте источники там и делитесь контентом в сферы.
        </p>
        {session?.user?.id ? (
          <Link href="/me/content" className="platform-btn platform-btn-primary no-underline">
            <i className="fas fa-layer-group" style={{ marginRight: 8 }} />
            Открыть Сборку
          </Link>
        ) : (
          <p className="platform-card-desc">
            <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(`/universes/${slug}/settings/aggregator`)}`} style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
              Войдите
            </Link>
            , чтобы настроить источники в Сборке.
          </p>
        )}
        <p className="platform-card-desc mt-6">
          <Link href={`/universes/${slug}/content`} style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
            Лента комнаты
          </Link>
        </p>
      </div>
    </div>
  );
}
