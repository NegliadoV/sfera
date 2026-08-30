'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getYouTubeVideoId } from '@/lib/youtube';
import { isDirectVideoUrl } from '@/lib/video-url';
import { ImageLightbox } from '@/components/ImageLightbox';

export interface ContentPreviewProps {
  url: string | null;
  imageUrl: string | null;
  type: string | null;
  title: string;
  /** Ссылка на страницу контента (для кликабельного превью видео) */
  contentHref?: string | null;
}

export function ContentPreview({ url, imageUrl, type, title, contentHref }: ContentPreviewProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const youtubeVideoId = url ? getYouTubeVideoId(url) : null;
  const directVideoUrl = url && isDirectVideoUrl(url) ? url : null;
  const isVideo = type === 'video' || youtubeVideoId || directVideoUrl;
  const showPlayOverlay = isVideo && (youtubeVideoId || imageUrl);

  // Картинка не загрузилась — скрываем весь блок
  if (imgFailed) return null;

  const previewContent = (
    <>
      {youtubeVideoId ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`}
          alt={title}
          className="content-preview-image"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            // Пробуем hqdefault, потом скрываем
            if (target.src.includes('maxresdefault')) {
              target.src = `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;
            } else {
              setImgFailed(true);
            }
          }}
        />
      ) : imageUrl ? (
        <ImageLightbox
          src={imageUrl}
          originalSrc={imageUrl}
          alt={title}
          className="content-preview-image"
          onError={() => setImgFailed(true)}
        />
      ) : null}
      {showPlayOverlay && (
        <div className="content-preview-overlay content-preview-play-overlay" aria-hidden>
          <i className="fa-solid fa-play" style={{ fontSize: '2rem', color: 'white' }} />
        </div>
      )}
    </>
  );

  if (youtubeVideoId) {
    return (
      <div className={`content-preview content-preview-video ${showPlayOverlay ? 'content-preview-clickable' : ''}`}>
        {contentHref ? (
          <Link href={contentHref} className="content-preview-link">
            {previewContent}
          </Link>
        ) : (
          previewContent
        )}
      </div>
    );
  }

  if (directVideoUrl) {
    return (
      <div className="content-preview content-preview-video">
        <video
          src={directVideoUrl}
          controls
          playsInline
          preload="metadata"
          className="content-preview-video-el"
        />
      </div>
    );
  }

  if (imageUrl) {
    return (
      <div className={`content-preview content-preview-image ${contentHref && isVideo ? 'content-preview-clickable' : ''}`}>
        {contentHref && isVideo ? (
          <Link href={contentHref} className="content-preview-link">
            {previewContent}
          </Link>
        ) : (
          previewContent
        )}
      </div>
    );
  }

  // Ничего не рендерим — нет ни картинки, ни видео
  return null;
}
