import { getSessionForServerComponent } from '@/lib/session';
import { db, mindMaps } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MindMapCreateButton } from './MindMapCreateButton';

import { DeleteMindMapButton } from '@/components/mind-maps/DeleteMindMapButton';

export const dynamic = 'force-dynamic';

export default async function PersonalMindMapsPage() {
  const session = await getSessionForServerComponent();
  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/me/mind-maps');
  }

  const mapsList = await db
    .select()
    .from(mindMaps)
    .where(eq(mindMaps.createdById, session.user.id))
    .orderBy(desc(mindMaps.updatedAt));

  return (
    <div className="platform-page">
      <div className="platform-breadcrumb mb-6">
        <Link href="/">Сферы</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <Link href="/me/content">Мой контент</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>Ментальные карты</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-extrabold text-white m-0">Мои Карты</h1>
        <MindMapCreateButton />
      </div>

      {mapsList.length === 0 ? (
        <div className="platform-card flex flex-col items-center justify-center p-12 text-center border border-dashed border-white/20 bg-white/5">
          <i className="fa-solid fa-project-diagram text-4xl mb-4 opacity-50 text-[var(--studio-ctrl-icon)]" aria-hidden />
          <h2 className="text-xl font-semibold mb-2 text-white">У вас пока нет ментальных карт</h2>
          <p className="text-sm opacity-70 mb-6">
            Создайте свою первую карту для мозгового штурма и планирования. Вы сможете добавлять текстовые узлы и вставлять полноценные публикации из ленты.
          </p>
          <MindMapCreateButton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mapsList.map((map) => (
            <div key={map.id} className="relative group">
              <Link 
                href={`/me/mind-maps/${map.id}`} 
                className="no-underline block h-full"
              >
                <div className="platform-card h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white/10 hover:border-white/20 bg-[var(--studio-panel-bg)] flex flex-col">
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-[var(--accent-primary)]/20">
                          <i className="fa-solid fa-network-wired" aria-hidden />
                        </div>
                        <h3 className="text-lg font-bold text-white leading-tight break-words m-0 group-hover:text-[var(--accent-primary)] transition-colors truncate">
                          {map.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 text-xs text-white/50 font-medium">
                    {map.universeId ? (
                      <span className="flex items-center gap-1">
                        <i className="fa-solid fa-globe" /> Вселенная
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <i className="fa-solid fa-lock" /> Приватная
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <time dateTime={map.updatedAt.toISOString()}>
                        {map.updatedAt.toLocaleDateString('ru')}
                      </time>
                      <DeleteMindMapButton mapId={map.id} mapTitle={map.title} />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
