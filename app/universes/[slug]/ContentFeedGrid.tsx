'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MarkdownBody } from '@/components/MarkdownBody';
import { ContentPoll } from '@/components/ContentPoll';
import { ContentCard } from './ContentCard';
import { InlineCommentsSection } from '@/components/content/InlineCommentsSection';
import { ResonanceBar } from '@/components/content/ResonanceBar';
import { useTranslation } from '@/components/i18n/LanguageProvider';
import type { Session } from 'next-auth';

export function ContentFeedGrid({
  items,
  slug,
  canDelete = false,
  canEdit = false,
  canPin = false,
  layout = 'grid',
  session = null,
}: {
  items: any[];
  slug: string;
  canDelete?: boolean;
  canEdit?: boolean;
  canPin?: boolean;
  layout?: 'grid' | 'list';
  session?: Session | null;
}) {
  const { t, locale } = useTranslation();
  const [openedPostId, setOpenedPostId] = useState<string | null>(null);
  const [isAddingToMap, setIsAddingToMap] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Восстанавливаем открытый пост из URL query при загрузке или popstate
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const postId = params.get('post');
      if (postId && items.some((i) => i.id === postId)) {
        setOpenedPostId(postId);
      }
    };
    checkUrl();
    window.addEventListener('popstate', checkUrl);
    return () => window.removeEventListener('popstate', checkUrl);
  }, [items]);

  // Синхронизируем URL с открытым постом
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const currentParam = url.searchParams.get('post');
    if (openedPostId) {
      if (currentParam !== openedPostId) {
        url.searchParams.set('post', openedPostId);
        window.history.replaceState(null, '', url.pathname + url.search);
      }
    } else {
      if (currentParam) {
        url.searchParams.delete('post');
        window.history.replaceState(null, '', url.pathname + url.search);
      }
    }
  }, [openedPostId]);

  // При открытии ридера скроллим ровно к выбранному посту
  useEffect(() => {
    if (!openedPostId) return;

    // Фиксируем просмотр выбранного поста
    fetch(`/api/content/${openedPostId}/view`, { method: 'POST' }).catch(() => {});

    // Блокируем скролл основной страницы
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Мгновенно скроллим контейнер к кликнутому посту
    const targetElement = document.getElementById(`reader-post-${openedPostId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'instant', block: 'start' });
    } else {
      setTimeout(() => {
        const el = document.getElementById(`reader-post-${openedPostId}`);
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      }, 50);
    }

    // Закрытие по Esc
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenedPostId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openedPostId]);

  const handleAddToMap = async (item: any) => {
    setIsAddingToMap(item.id);
    try {
      const res = await fetch('/api/me/mind-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Конспект: ${item.title}` }),
      });
      if (res.ok) {
        const map = await res.json();
        const newNode = {
          id: crypto.randomUUID(),
          type: 'post',
          position: { x: 250, y: 150 },
          data: { contentId: item.id, bgColor: 'rgba(20, 20, 25, 0.8)' },
        };
        await fetch(`/api/me/mind-maps/${map.id}/sync`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodes: [newNode], edges: [] }),
        });
        await fetch(`/api/content/${item.id}/save`, { method: 'POST' }).catch(() => {});
        router.push(`/me/mind-maps/${map.id}`);
      }
    } catch (e) {
      console.error(e);
      alert('Не удалось создать Карту');
    } finally {
      setIsAddingToMap(null);
    }
  };

  return (
    <>
      {layout === 'grid' && (
        <div className="platform-card-desc mb-4">
          {t('rooms.pinnedFirst', 'Закреплённые посты отображаются сверху.')}
        </div>
      )}
      <div
        className={
          layout === 'grid'
            ? 'columns-1 md:columns-2 xl:columns-3 gap-4 md:gap-6'
            : 'flex flex-col gap-2 items-start'
        }
      >
        {items.map((c) => (
          <div key={c.id} className="break-inside-avoid mb-4 md:mb-6">
            <ContentCard
              {...c}
              slug={c.universeSlug || slug}
              canDelete={canDelete}
              canEdit={canEdit}
              canPin={canPin}
              onOpenModal={() => setOpenedPostId(c.id)}
            />
          </div>
        ))}
      </div>

      {/* Одиночный ридер — рендерит только текущий пост */}
      {openedPostId &&
        typeof document !== 'undefined' &&
        createPortal(
          <ReaderModal
            items={items}
            openedPostId={openedPostId}
            onClose={() => setOpenedPostId(null)}
            onNavigate={setOpenedPostId}
            session={session}
            slug={slug}
            isAddingToMap={isAddingToMap}
            onAddToMap={handleAddToMap}
            t={t}
            locale={locale}
          />,
          document.body
        )}
    </>
  );
}

// ------------------------------------------------------------------
// Стили для slide-анимаций (вставляются в <head> 1 раз)
// ------------------------------------------------------------------
const SWIPE_CSS = `
  @keyframes slideInUp    { from { transform: translateY(60px);  opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes slideInDown  { from { transform: translateY(-60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes slideOutUp   { from { transform: translateY(0); opacity: 1; } to { transform: translateY(-60px); opacity: 0; } }
  @keyframes slideOutDown { from { transform: translateY(0); opacity: 1; } to { transform: translateY(60px);  opacity: 0; } }

  .slide-in-up   { animation: slideInUp   0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
  .slide-in-down { animation: slideInDown 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }

  /* Hint pulsa */
  @keyframes hintFade { 0%,100%{opacity:0;} 30%,70%{opacity:1;} }
  .swipe-hint { animation: hintFade 2.4s ease 0.4s both; }
`;

// ------------------------------------------------------------------
// Ридер — 1 пост, навигация скроллом/свайпом (TikTok-стиль)
// ------------------------------------------------------------------
function ReaderModal({
  items,
  openedPostId,
  onClose,
  onNavigate,
  session,
  slug,
  isAddingToMap,
  onAddToMap,
  t,
  locale,
}: {
  items: any[];
  openedPostId: string;
  onClose: () => void;
  onNavigate: (id: string) => void;
  session: any;
  slug: string;
  isAddingToMap: string | null;
  onAddToMap: (item: any) => void;
  t: (key: string, fallback: string) => string;
  locale: string;
}) {
  const currentIdx = items.findIndex((i) => i.id === openedPostId);
  const item = items[currentIdx];

  // direction: 'up' = идём к следующему, 'down' = к предыдущему
  const [slideDir, setSlideDir] = useState<'up' | 'down'>('up');
  const [animKey, setAnimKey] = useState(0);

  // Защита от множественных быстрых свайпов
  const coolingRef = useRef(false);
  // Для touch
  const touchStartY = useRef<number | null>(null);
  // Для отслеживания: находится ли контент-скролл в крайнем положении
  const scrollRef = useRef<HTMLDivElement>(null);

  const navigate = useCallback(
    (dir: 'up' | 'down') => {
      if (coolingRef.current) return;
      if (dir === 'up' && currentIdx >= items.length - 1) return;
      if (dir === 'down' && currentIdx <= 0) return;

      coolingRef.current = true;
      setSlideDir(dir);
      setAnimKey((k) => k + 1);

      const nextId = dir === 'up'
        ? items[currentIdx + 1].id
        : items[currentIdx - 1].id;

      // Небольшая задержка, чтобы exit-анимация (не делаем — просто fade) не мешала
      // Рендерим новый пост сразу (enter-анимация сама покажет движение)
      onNavigate(nextId);

      setTimeout(() => { coolingRef.current = false; }, 450);
    },
    [currentIdx, items, onNavigate]
  );

  // Keyboard + body scroll lock + view tracking
  useEffect(() => {
    fetch(`/api/content/${openedPostId}/view`, { method: 'POST' }).catch(() => {});
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') navigate('up');
      if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  navigate('down');
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [openedPostId, onClose, navigate]);

  // Wheel: срабатывает только когда контент-скролл на краю
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      const el = scrollRef.current;
      if (!el) return;

      const atTop    = el.scrollTop <= 2;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;

      if (e.deltaY > 0 && atBottom) { e.preventDefault(); navigate('up'); }
      if (e.deltaY < 0 && atTop)    { e.preventDefault(); navigate('down'); }
    },
    [navigate]
  );

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartY.current === null) return;
      const delta = touchStartY.current - e.changedTouches[0].clientY;

      const el = scrollRef.current;
      const atTop    = !el || el.scrollTop <= 2;
      const atBottom = !el || el.scrollTop + el.clientHeight >= el.scrollHeight - 2;

      if (delta > 50  && atBottom) navigate('up');
      if (delta < -50 && atTop)    navigate('down');
      touchStartY.current = null;
    },
    [navigate]
  );

  if (!item) return null;

  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < items.length - 1;
  const slideClass = slideDir === 'up' ? 'slide-in-up' : 'slide-in-down';

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col bg-[#0b0d13]/96 backdrop-blur-2xl animate-in fade-in duration-200"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style dangerouslySetInnerHTML={{ __html: SWIPE_CSS }} />

      {/* Топ-панель */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 md:px-8 md:py-4 border-b border-white/10 bg-black/50 backdrop-blur-md z-20">
        <div className="flex items-center gap-2 text-xs md:text-sm text-white/70">
          <i className="fa-solid fa-book-open text-[var(--accent-primary)]" />
          <span className="font-semibold text-white">{t('rooms.feed', 'Лента материалов')}</span>
          <span className="text-white/40">{currentIdx + 1} / {items.length}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Кнопки для мыши */}
          <button
            type="button"
            onClick={() => navigate('down')}
            disabled={!hasPrev}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-25 flex items-center justify-center text-white transition cursor-pointer disabled:cursor-default"
            title="Предыдущий (↑)"
          >
            <i className="fa-solid fa-chevron-up text-xs" />
          </button>
          <button
            type="button"
            onClick={() => navigate('up')}
            disabled={!hasNext}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-25 flex items-center justify-center text-white transition cursor-pointer disabled:cursor-default"
            title="Следующий (↓)"
          >
            <i className="fa-solid fa-chevron-down text-xs" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-red-500/80 flex items-center justify-center text-white transition cursor-pointer ml-1"
            title="Закрыть (Esc)"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>
      </div>

      {/* Контент-область со своим скроллом */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 md:py-10 flex flex-col items-center"
      >
        {/* Post card — key меняется при навигации, триггерит анимацию */}
        <article
          key={`${item.id}-${animKey}`}
          className={`w-full max-w-[680px] flex flex-col gap-6 p-6 md:p-8 rounded-2xl bg-white/[0.03] border border-white/10 shadow-2xl ${slideClass}`}
        >
          {/* Мета */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex flex-col">
              <div className="text-white/90 font-semibold text-sm">
                {item.externalAuthor || item.authorName || t('contentCard.member', 'Участник')}
              </div>
              <div className="text-[var(--text-meta)] text-xs">
                {(item.publishedAt ? new Date(item.publishedAt) : new Date(item.createdAt)).toLocaleDateString(
                  locale,
                  { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }
                )}
              </div>
            </div>
            {item.universeName && (
              <Link
                href={`/universes/${encodeURIComponent(item.universeSlug || slug)}`}
                onClick={onClose}
                className="text-xs px-2.5 py-1 rounded-lg bg-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/35 text-white border border-[var(--accent-primary)]/30 font-medium transition flex items-center gap-1.5"
              >
                <i className="fa-solid fa-shapes text-[10px] text-[var(--accent-primary)]" />
                {item.universeName}
              </Link>
            )}
          </div>

          {/* Заголовок */}
          <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
            {item.title}
          </h1>

          {/* Изображение */}
          {item.imageUrl && (
            <div className="w-full my-2">
              <img
                src={item.imageUrl}
                alt=""
                className="w-full rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] object-cover max-h-[65vh] border border-white/10"
              />
            </div>
          )}

          {/* Текст */}
          {item.body && (
            <div className="text-white/90 prose prose-invert prose-lg max-w-none leading-relaxed">
              <MarkdownBody content={item.body} />
            </div>
          )}

          {/* Опрос */}
          {item.pollData && (
            <div className="w-full my-3">
              <ContentPoll pollId={item.pollData.id} options={item.pollData.options as any} />
            </div>
          )}

          {/* Ссылка */}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--accent-primary)] hover:underline break-all p-3.5 rounded-xl bg-white/5 border border-white/10 inline-flex items-center gap-2 text-sm my-1"
            >
              <i className="fa-solid fa-arrow-up-right-from-square" />
              {item.url}
            </a>
          )}

          {/* Кнопки действий */}
          <div className="w-full mt-4 flex flex-wrap justify-start items-center gap-3 pt-4 border-t border-white/10">
            <Link
              href={`/universes/${encodeURIComponent(item.universeSlug || slug)}`}
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-center text-sm font-semibold transition flex items-center justify-center gap-2 border border-white/15 shadow-md"
            >
              <i className="fa-solid fa-door-open text-emerald-400" />
              {t('rooms.goToRoom', 'Перейти в комнату')}
            </Link>

            <Link
              href={`/universes/${item.universeSlug || slug}/content/${item.id}#discussion`}
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:brightness-110 text-white text-center text-sm font-semibold transition flex items-center justify-center gap-2 shadow-md"
            >
              <i className="fa-solid fa-comments" />
              {t('rooms.discussion', 'Обсуждение')}
            </Link>

            <button
              type="button"
              onClick={() => onAddToMap(item)}
              disabled={isAddingToMap === item.id}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#2196f3] hover:brightness-110 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                isAddingToMap === item.id ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isAddingToMap === item.id
                ? <i className="fa-solid fa-spinner fa-spin" />
                : <i className="fa-solid fa-project-diagram" />}
              {t('rooms.toMyMap', 'В Личную Карту')}
            </button>
          </div>

          {/* Резонанс */}
          <ResonanceBar contentId={item.id} isLoggedIn={!!session?.user?.id} />

          {/* Комментарии */}
          <InlineCommentsSection
            contentId={item.id}
            currentUserId={session?.user?.id}
            currentUserImage={session?.user?.image}
            currentUserName={session?.user?.name}
          />
        </article>

        {/* Подсказка «листайте вниз» при первом открытии */}
        {hasNext && (
          <div className="swipe-hint flex flex-col items-center gap-1 mt-6 mb-4 text-white/30 text-xs select-none pointer-events-none">
            <i className="fa-solid fa-chevron-down text-lg animate-bounce" />
            <span>{t('rooms.scrollNext', 'Скрольте вниз для следующего')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
