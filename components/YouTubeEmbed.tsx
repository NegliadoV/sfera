'use client';

/**
 * Встраивает плеер YouTube по ID видео.
 * Соотношение сторон 16:9, адаптивная ширина.
 * Используется youtube-nocookie.com для лучшей совместимости.
 * @param compact — при true ограничивает ширину 50% (по умолчанию)
 */
export function YouTubeEmbed({ videoId, title, compact = true }: { videoId: string; title?: string; compact?: boolean }) {
  const embedUrl = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0`;

  return (
    <div className={compact ? 'video-embed-half' : ''} style={compact ? undefined : { width: '100%' }}>
      <div
        className="relative w-full overflow-hidden rounded-[var(--radius-lg)] border my-4"
        style={{
          paddingBottom: '56.25%', // 16:9
          borderColor: 'var(--border-color)',
          backgroundColor: 'var(--bg-accent)',
          minHeight: 200,
        }}
      >
        <iframe
          src={embedUrl}
          title={title ?? 'YouTube video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="eager"
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 w-full h-full border-0"
          width={560}
          height={315}
        />
      </div>
    </div>
  );
}
