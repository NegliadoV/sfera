import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSessionForServerComponent } from '@/lib/session';
import { db, universes, rooms, user, themes } from '@/lib/db';
import { eq, desc, asc } from 'drizzle-orm';
import { normalizeUniverseSlug } from '@/lib/universe-slug';
import { RoomsList } from './RoomsList';

const STATUS_LABEL: Record<string, string> = {
  waiting: 'Ожидание',
  ongoing: 'Идёт',
  finished: 'Завершена',
};

export const dynamic = 'force-dynamic';

export default async function UniverseRoomsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const slug = normalizeUniverseSlug((await params).slug);
  if (!slug) notFound();
  const sp = await searchParams;
  const defaultContentId = typeof sp?.contentId === 'string' ? sp.contentId : undefined;
  const defaultTitle = typeof sp?.title === 'string' ? decodeURIComponent(sp.title) : undefined;
  const [u] = await db.select().from(universes).where(eq(universes.slug, slug)).limit(1);
  if (!u) notFound();

  const roomsList = await db
    .select({
      id: rooms.id,
      title: rooms.title,
      status: rooms.status,
      themeId: rooms.themeId,
      themeName: themes.name,
      timeLimitMinutes: rooms.timeLimitMinutes,
      createdById: rooms.createdById,
      currentRoundIndex: rooms.currentRoundIndex,
      createdAt: rooms.createdAt,
      creatorName: user.name,
    })
    .from(rooms)
    .leftJoin(user, eq(rooms.createdById, user.id))
    .leftJoin(themes, eq(rooms.themeId, themes.id))
    .where(eq(rooms.universeId, u.id))
    .orderBy(desc(rooms.createdAt))
    .limit(50);

  const themesList = await db
    .select({ id: themes.id, name: themes.name })
    .from(themes)
    .where(eq(themes.universeId, u.id))
    .orderBy(asc(themes.name));

  const session = await getSessionForServerComponent();

  return (
    <div className="platform-page">
      <div className="platform-breadcrumb mb-6">
        <Link href="/">Сферы</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <Link href={`/universes/${slug}`}>{u.name}</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>Комнаты просмотра</span>
      </div>
      <div className="platform-card mb-8">
        <div className="platform-card-title" style={{ marginBottom: 8 }}>
          <i className="fa-solid fa-video" aria-hidden />
          Комнаты просмотра
          <span className="platform-tag" style={{ marginLeft: 'auto' }}>Синхронный просмотр</span>
        </div>
        <p className="platform-card-desc mb-0">
          Сфера: <strong style={{ color: 'white' }}>{u.name}</strong>. Создайте комнату по теме или присоединяйтесь к существующим.
        </p>
        {session?.user?.id ? (
          <RoomsList
            slug={slug}
            universeName={u.name}
            themes={themesList}
            defaultContentId={defaultContentId}
            defaultTitle={defaultTitle}
            initialRooms={roomsList.map((r) => ({
              id: r.id,
              title: r.title,
              status: r.status,
              themeId: r.themeId ?? undefined,
              themeName: r.themeName ?? undefined,
              timeLimitMinutes: r.timeLimitMinutes ?? undefined,
              createdById: r.createdById,
              currentRoundIndex: r.currentRoundIndex,
              createdAt: r.createdAt.toISOString(),
              creatorName: r.creatorName ?? undefined,
            }))}
          />
        ) : (
          <>
            {roomsList.length === 0 ? (
              <p className="platform-card-desc mt-4">
                <Link
                  href={`/auth/signin?callbackUrl=${encodeURIComponent(`/universes/${slug}/rooms`)}`}
                  className="platform-btn platform-btn-primary no-underline"
                >
                  Войдите
                </Link>
                , чтобы создавать комнаты и присоединяться к ним.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
                {roomsList.map((r) => (
                  <Link
                    key={r.id}
                    href={`/universes/${slug}/rooms/${r.id}`}
                    className="content-card no-underline"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{ borderRadius: 24, width: 48, height: 48, minWidth: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--studio-panel-bg)', border: '1px solid var(--studio-panel-border)', color: 'var(--studio-ctrl-icon)' }}>
                      <i className="fas fa-video" aria-hidden />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', flex: 1 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <h3 className="platform-card-title" style={{ marginBottom: 0, fontSize: '1.1rem' }}>{r.title}</h3>
                          <span
                            className="platform-tag"
                            style={{
                              fontSize: '0.75rem',
                              background: r.status === 'ongoing' ? 'var(--studio-status-live-bg)' : r.status === 'finished' ? 'rgba(255,255,255,0.06)' : 'rgba(62, 131, 255, 0.2)',
                              borderColor: r.status === 'ongoing' ? 'var(--studio-status-live-border)' : 'rgba(255,255,255,0.1)',
                              color: r.status === 'ongoing' ? 'var(--studio-status-live-color)' : 'var(--studio-meta-color)',
                            }}
                          >
                            {STATUS_LABEL[r.status] ?? r.status}
                          </span>
                        </div>
                        <div className="platform-card-desc" style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {r.themeName && <><i className="fa-solid fa-tag" style={{ fontSize: '0.7rem' }} />{r.themeName} · </>}
                          <span>{r.creatorName ?? 'Автор'}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {!session?.user?.id && roomsList.length > 0 && (
        <p className="platform-card-desc mt-4">
          <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(`/universes/${slug}/rooms`)}`} className="platform-btn platform-btn-primary no-underline">
            Войдите
          </Link>
          , чтобы создавать комнаты и присоединяться к ним.
        </p>
      )}
    </div>
  );
}
