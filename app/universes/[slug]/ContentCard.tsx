'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, MouseEvent } from 'react';
import { useHygiene } from '@/components/HygieneProvider';
import { ContentPreview } from '@/components/content/ContentPreview';
import { DeleteContentButton } from './content/DeleteContentButton';

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
  slug: string;
  canDelete?: boolean;
  canEdit?: boolean;
  canPin?: boolean;
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
  slug,
  canDelete = false,
  canEdit = false,
  canPin = false,
}: ContentCardProps) {
  useHygiene();
  const router = useRouter();
  const [links, setLinks] = useState<Array<{ id: string; linkType: string; toContentId: string; note?: string }>>([]);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [pinning, setPinning] = useState(false);
  const isPinned = !!pinnedAt;

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

  const displayAuthor = externalAuthor || authorName || 'Участник';
  const displayDate = publishedAt ? new Date(publishedAt) : new Date(createdAt);

  const hasPreview = url || imageUrl;

  const handleContextMenu = (e: MouseEvent<HTMLDivElement>) => {
    if (!canDelete) return;
    e.preventDefault();
    e.stopPropagation();
    setShowDeletePrompt(true);
  };

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
      if (res.ok) router.refresh();
    } finally {
      setPinning(false);
    }
  };

  return (
    <div
      className="content-card content-card-feed content-card-hover-wrap"
      onContextMenu={handleContextMenu}
    >
      <Link
        href={`/universes/${slug}/content/${id}#discussion`}
        className="content-card-discussion-btn"
      >
        Перейти к обсуждению
      </Link>
      <div className="content-card-header">
        <div className="content-card-info">
          <div className="content-card-title-row">
            {isPinned && (
              <span className="content-card-pin-icon" title="Закреплён">
                📌
              </span>
            )}
            <Link
              href={`/universes/${slug}/content/${id}`}
              className="content-card-title"
            >
              {title}
            </Link>
            {type === 'article' && (
              <span className="platform-tag content-card-tag">
                Статья
              </span>
            )}
          </div>
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
            {canPin && (
              <button
                type="button"
                onClick={handlePinToggle}
                disabled={pinning}
                className="platform-btn platform-btn-sm"
                title={isPinned ? 'Открепить' : 'Закрепить'}
              >
                {pinning ? '…' : isPinned ? 'Открепить' : 'Закрепить'}
              </button>
            )}
            {canEdit && (
              <Link
                href={`/universes/${slug}/content/${id}?edit=1`}
                className="platform-btn platform-btn-sm"
              >
                Редактировать
              </Link>
            )}
            {commentCount !== undefined && commentCount > 0 && (
              <span>{commentCount}</span>
            )}
            {sourceId && (
              <span>Агрегировано</span>
            )}
            {hasLinks && links.length > 0 && (
              <span>{links.length} связей</span>
            )}
            <time dateTime={displayDate.toISOString()} title={displayDate.toLocaleString('ru')}>
              {displayDate.toLocaleDateString('ru', {
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
        <div className="content-card-preview-wrap">
          {hasPreview && (
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
            <p className="content-card-body">
              {(() => {
                const text = body.replace(/<[^>]+>/g, '').trim();
                return text.length > 200 ? `${text.slice(0, 200)}…` : text;
              })()}
            </p>
          )}
        </div>
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
              Удалить пост «{title}»?
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
              Отмена
            </button>
          </div>
        </>
      )}
    </div>
  );
}
