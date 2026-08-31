'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useHygiene } from '@/components/HygieneProvider';
import { ContentPreview } from '@/components/content/ContentPreview';
import { DeleteContentButton } from './content/DeleteContentButton';
import { useTranslation } from '@/components/i18n/LanguageProvider';

interface ContentCardProps {
  id: string;
  title: string;
  type?: string;
  url?: string | null;
  imageUrl?: string | null;
  body?: string | null;
  authorName?: string | null;
  externalAuthor?: string | null;
  publishedAt?: Date | string | null;
  pinnedAt?: Date | string | null;
  createdAt: Date | string;
  sourceId?: string | null;
  tags?: string[] | null;
  hasLinks?: boolean;
  commentCount?: number;
  savesCount?: number;
  slug: string;
  canDelete?: boolean;
  canEdit?: boolean;
  canPin?: boolean;
  onOpenModal?: () => void;
  universeName?: string | null;
  universeSlug?: string | null;
}

export function ContentCard({
  id,
  title,
  type,
  url,
  imageUrl,
  body,
  authorName,
  externalAuthor,
  publishedAt,
  pinnedAt,
  createdAt,
  sourceId,
  tags,
  hasLinks,
  commentCount,
  savesCount,
  slug,
  canDelete = false,
  canEdit = false,
  canPin = false,
  onOpenModal,
  universeName,
  universeSlug,
}: ContentCardProps) {
  useHygiene();
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [links, setLinks] = useState<Array<{ id: string; linkType: string; toContentId: string; note?: string }>>([]);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [pinning, setPinning] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchPosRef = useRef({ x: 0, y: 0 });
  const longPressTriggeredRef = useRef(false);
  const isPinned = !!pinnedAt;

  const shareSearch = `?shareContent=${encodeURIComponent(id)}&shareTitle=${encodeURIComponent(title)}&shareSlug=${encodeURIComponent(slug)}`;

  useEffect(() => {
    if (!hasLinks) return;
    let cancelled = false;
    fetch(`/api/content/${id}/links`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load links: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setLinks(data);
      })
      .catch((err) => {
        if (!cancelled) console.error('Failed to load content links:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [id, hasLinks]);

  const displayAuthor = externalAuthor || authorName || t('contentCard.member', 'Участник');
  const displayDate = publishedAt ? new Date(publishedAt) : new Date(createdAt);
  const localeMap: Record<string, string> = { ru: 'ru', en: 'en', zh: 'zh', ja: 'ja', ko: 'ko', vi: 'vi', es: 'es', de: 'de', fr: 'fr' };
  const dateLocale = localeMap[locale] ?? 'ru';

  const hasPreview = url || imageUrl;

  const normalizeForComparison = (str: string) => {
    if (!str) return '';
    return str
      .replace(/<[^>]+>/g, ' ') // Strip HTML tags
      .replace(/&[a-z0-9#]+;/gi, ' ') // Strip HTML entities like &nbsp;
      .replace(/[^\p{L}\p{N}]+/gu, '') // Keep ONLY letters and numbers, remove all spaces/punctuation
      .toLowerCase();
  };

  const normTitle = normalizeForComparison(title || '');
  const normBody = normalizeForComparison(body || '');
  const titleNoEllipsis = (title || '').replace(/[\.…]+$/, '');
  const normTitleNoEllipsis = normalizeForComparison(titleNoEllipsis);

  // If the normalized title is very short (e.g. "План"), it might accidentally match 
  // a body starting with "Планирование". So we require length > 15 for prefix match,
  // or an exact match regardless of length.
  const isDuplicate = Boolean(
    normTitle && normBody && (
      normTitle === normBody ||
      (normTitleNoEllipsis.length > 15 && normBody.startsWith(normTitleNoEllipsis)) ||
      (normTitle.length > 15 && normBody.startsWith(normTitle))
    )
  );

  const handleContextMenu = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const LONG_PRESS_MS = 500;

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    longPressTriggeredRef.current = false;
    clearLongPressTimer();
    const t = e.touches[0];
    if (t) {
      touchPosRef.current = { x: t.clientX, y: t.clientY };
      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null;
        longPressTriggeredRef.current = true;
        setContextMenuPos({ x: touchPosRef.current.x, y: touchPosRef.current.y });
        setShowContextMenu(true);
      }, LONG_PRESS_MS);
    }
  };

  const handleTouchMove = () => {
    clearLongPressTimer();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    clearLongPressTimer();
    if (longPressTriggeredRef.current) {
      e.preventDefault();
      longPressTriggeredRef.current = false;
    }
  };

  useEffect(() => {
    if (!showContextMenu) return;
    const handleClick = (e: Event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    };
    const handleScroll = () => setShowContextMenu(false);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('contextmenu', handleClick, true);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('contextmenu', handleClick, true);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showContextMenu]);

  const handlePinToggle = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canPin || pinning) return;
    setPinning(true);
    try {
      const res = await fetch(`/api/content/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !isPinned }),
        credentials: 'include',
      });
    } finally {
      setPinning(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    fetch(`/api/content/${id}/view`, { method: 'POST' }).catch(() => {});
    if (onOpenModal) onOpenModal();
  };

  return (
    <div
      className={`content-card glass-panel content-card-hover-wrap flex flex-col ${
        (type === 'short' || imageUrl) ? 'row-span-2' : ''
      }`}
      style={{ border: 'none', cursor: 'pointer' }}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={clearLongPressTimer}
      onClick={handleCardClick}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          fetch(`/api/content/${id}/view`, { method: 'POST' }).catch(() => {});
          if (onOpenModal) onOpenModal();
        }}
        className="content-card-discussion-btn z-10"
      >
        {t('rooms.read', 'Читать')}
      </button>
      <div className="content-card-header flex-none w-full">
        <div className="content-card-info">
          {!isDuplicate ? (
            <div className="content-card-title-row">
              {isPinned && (
                <span className="content-card-pin-icon" title={t('contentCard.pinTitle', 'Закреплён')}>
                  📌
                </span>
              )}
              {universeName && (
                <span className="content-card-universe-tag">
                  {universeName}
                </span>
              )}
              <a
                href={`/universes/${universeSlug ?? slug}/content/${id}`}
                className="content-card-title cursor-pointer"
                onClick={(e) => { 
                  if (onOpenModal) {
                    e.preventDefault(); 
                    onOpenModal(); 
                  }
                }}
              >
                {title}
              </a>
              {type === 'article' && (
                <span className="platform-tag content-card-tag">
                  Статья
                </span>
              )}
            </div>
          ) : (
            <div className="content-card-title-row" style={{ minHeight: 'auto', marginBottom: 4 }}>
              {isPinned && (
                <span className="content-card-pin-icon" title={t('contentCard.pinTitle', 'Закреплён')}>
                  📌
                </span>
              )}
              {type === 'article' && (
                <span className="platform-tag content-card-tag">
                  {t('contentCard.article', 'Статья')}
                </span>
              )}
            </div>
          )}
          <div className="content-card-meta">
            {displayAuthor}
            {tags && Array.isArray(tags) && tags.length > 0 && (
              <>
                <span className="content-card-separator">·</span>
                <span>{tags.slice(0, 3).join(', ')}</span>
              </>
            )}
          </div>
          <div className="content-card-footer" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            {commentCount !== undefined && commentCount > 0 && (
              <div className="flex items-center gap-1.5 opacity-80" aria-label={`${t('contentCard.article', 'Комментариев')}: ${commentCount}`}>
                <i className="fa-solid fa-comment text-[0.8rem]" />
                <span className="font-medium text-xs">{commentCount}</span>
              </div>
            )}
            {savesCount !== undefined && savesCount > 0 && (
              <div className="flex items-center gap-1.5 opacity-90 text-[var(--accent-primary)] drop-shadow-[0_0_8px_rgba(var(--accent-primary-rgb,139,92,246),0.5)]" title={`${t('contentCard.savedToMaps', 'Сохранено в Карты')}: ${savesCount}`}>
                <i className="fa-solid fa-project-diagram text-[0.8rem]" />
                <span className="font-bold text-xs">{savesCount}</span>
              </div>
            )}
            {sourceId && url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title={t('contentCard.readAtSource', 'Читать в источнике')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  color: 'var(--accent-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  borderRadius: 4,
                  padding: '2px 6px',
                  background: 'rgba(var(--accent-primary-rgb, 139,92,246), 0.08)',
                  border: '1px solid rgba(var(--accent-primary-rgb, 139,92,246), 0.2)',
                  transition: 'background 0.15s',
                  flexShrink: 0,
                }}
              >
                <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.65rem' }} aria-hidden />
                {t('contentCard.readAtSource', 'Читать в источнике')}
              </a>
            )}
            {sourceId && !url && (
              <span style={{ fontSize: '0.78rem', opacity: 0.6 }}>
                <i className="fa-solid fa-rss" style={{ fontSize: '0.65rem' }} aria-hidden />{' '}
                {t('contentCard.aggregated', 'Агрегировано')}
              </span>
            )}
            {hasLinks && links.length > 0 && (
              <span>{links.length} {t('contentCard.connections', 'связей')}</span>
            )}
            <time dateTime={displayDate.toISOString()} title={displayDate.toLocaleString(dateLocale)}>
              {displayDate.toLocaleDateString(dateLocale, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </time>
          </div>
        </div>
      </div>
      {(hasPreview || body) && (
        <div className="content-card-preview-wrap pointer-events-none">
          {hasPreview && (imageUrl || url?.includes('youtube') || url?.includes('youtu.be')) && (
            <div className="content-card-preview">
              <ContentPreview
                url={url ?? null}
                imageUrl={imageUrl ?? null}
                type={type || null}
                title={title}
                contentHref={`/universes/${slug}/content/${id}`}
              />
            </div>
          )}
          {body && (
            <p className="content-card-body pointer-events-auto">
              {isDuplicate ? (
                <a
                  href={`/universes/${slug}/content/${id}`}
                  className="w-full block"
                  style={{ color: 'inherit', textDecoration: 'none' }}
                  onClick={(e) => { 
                    if (onOpenModal) {
                      e.preventDefault(); 
                      onOpenModal(); 
                    }
                  }}
                >
                  {(() => {
                    const text = body
                      .replace(/<[^>]+>/g, '')
                      .replace(/(\*\*|__)(.*?)\1/g, '$2')
                      .replace(/(\*|_)(.*?)\1/g, '$2')
                      .replace(/#+\s/g, '')
                      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
                      .replace(/`{1,3}[^`\n]*`{1,3}/g, '')
                      .trim();
                    return text.length > 200 ? `${text.slice(0, 200)}…` : text;
                  })()}
                </a>
              ) : (
                (() => {
                  const text = body
                    .replace(/<[^>]+>/g, '')
                    .replace(/(\*\*|__)(.*?)\1/g, '$2')
                    .replace(/(\*|_)(.*?)\1/g, '$2')
                    .replace(/#+\s/g, '')
                    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
                    .replace(/`{1,3}[^`\n]*`{1,3}/g, '')
                    .trim();
                  return text.length > 200 ? `${text.slice(0, 200)}…` : text;
                })()
              )}
            </p>
          )}
        </div>
      )}
      {showContextMenu && typeof document !== 'undefined' && createPortal(
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            aria-hidden
            onClick={() => setShowContextMenu(false)}
          />
          <div
            ref={contextMenuRef}
            role="menu"
            className="platform-card"
            style={{
              position: 'fixed',
              left: contextMenuPos.x,
              top: contextMenuPos.y,
              zIndex: 9999,
              minWidth: 200,
              padding: 4,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {canEdit && (
              <Link
                href={`/universes/${slug}/content/${id}?edit=1`}
                className="platform-btn platform-btn-sm no-underline w-full justify-start gap-2"
                style={{ display: 'flex', marginBottom: 4 }}
                onClick={() => setShowContextMenu(false)}
              >
                <i className="fa-solid fa-pen" aria-hidden />
                {t('contentCard.deletePost', 'Изменить')}
              </Link>
            )}
            {canPin && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowContextMenu(false);
                  handlePinToggle(e);
                }}
                disabled={pinning}
                className="platform-btn platform-btn-sm w-full justify-start gap-2"
                style={{ display: 'flex', marginBottom: 4 }}
              >
                <i className="fa-solid fa-thumbtack" aria-hidden />
                {pinning ? '…' : isPinned ? t('contentCard.unpin', 'Открепить') : t('contentCard.pin', 'Закрепить')}
              </button>
            )}
            <Link
              href={`/messages${shareSearch}`}
              className="platform-btn platform-btn-sm no-underline w-full justify-start gap-2"
              style={{ display: 'flex', marginBottom: 4 }}
              onClick={() => setShowContextMenu(false)}
            >
              <i className="fa-solid fa-paper-plane" aria-hidden />
              {t('contentCard.forward', 'Переслать')}
            </Link>
            <button
              type="button"
              className="platform-btn platform-btn-sm w-full justify-start gap-2"
              style={{ display: 'flex', marginBottom: 4 }}
              onClick={(e) => {
                e.preventDefault();
                setShowContextMenu(false);
                // Create a full URL assuming window.location.origin
                const link = `${window.location.origin}/universes/${slug}/content/${id}`;
                navigator.clipboard.writeText(link);
              }}
            >
              <i className="fa-solid fa-link" aria-hidden />
              {t('contentCard.copyLink', 'Ск/Ссылка')}
            </button>
            <button
              type="button"
              className="platform-btn platform-btn-sm w-full justify-start gap-2"
              style={{ display: 'flex', marginBottom: canDelete ? 4 : 0 }}
              onClick={(e) => {
                e.preventDefault();
                setShowContextMenu(false);
                navigator.clipboard.writeText(id);
              }}
            >
              <i className="fa-solid fa-fingerprint" aria-hidden />
              {t('contentCard.copyId', 'Ск/ID (для Карты)')}
            </button>
            {canDelete && (
              <button
                type="button"
                className="platform-btn platform-btn-sm w-full justify-start gap-2"
                style={{ display: 'flex', color: 'var(--text-danger, #e5534b)' }}
                onClick={() => {
                  setShowContextMenu(false);
                  setShowDeletePrompt(true);
                }}
              >
                <i className="fa-solid fa-trash" aria-hidden />
                {t('contentCard.deletePost', 'Удалить')}
              </button>
            )}
          </div>
        </>,
        document.body
      )}
      {canDelete && showDeletePrompt && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            onClick={() => setShowDeletePrompt(false)}
            aria-hidden
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9999,
              background: 'var(--studio-panel-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              padding: 16,
              minWidth: 240,
            }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <p style={{ marginBottom: 12, fontSize: '0.9rem' }}>
              {t('contentCard.deleteConfirm', 'Удалить пост')} «{title}»?
            </p>
            <DeleteContentButton
              contentId={id}
              slug={slug}
              title={title}
              className="platform-btn platform-btn-sm w-full"
              onDeleted={() => setShowDeletePrompt(false)}
            />
            <button
              type="button"
              onClick={() => setShowDeletePrompt(false)}
              className="platform-btn platform-btn-sm w-full"
              style={{ marginTop: 8 }}
            >
              {t('common.cancel', 'Отмена')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
