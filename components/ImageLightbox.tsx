'use client';

import { useState, MouseEvent, CSSProperties } from 'react';
import { createPortal } from 'react-dom';

type ImageLightboxProps = {
  src: string;
  /** Исходный URL для ссылки «Открыть в новой вкладке» при ошибке загрузки */
  originalSrc?: string | null;
  alt?: string;
  className?: string;
  style?: CSSProperties;
};

export function ImageLightbox({ src, originalSrc, alt = '', className = '', style }: ImageLightboxProps) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleClick = (e: MouseEvent<HTMLImageElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!failed) setOpen(true);
  };

  const overlay =
    open && typeof document !== 'undefined'
      ? createPortal(
          <>
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2147483646,
                background: 'rgba(0,0,0,0.7)',
              }}
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2147483647,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
              }}
              onClick={() => setOpen(false)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                referrerPolicy="no-referrer"
                style={{
                  maxWidth: '95vw',
                  maxHeight: '95vh',
                  borderRadius: 12,
                  boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </>,
          document.body
        )
      : null;

  if (failed) {
    return (
      <div
        className={className}
        style={{
          ...style,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          backgroundColor: 'var(--bg-accent, #2a2d31)',
          color: 'var(--text-secondary, #888)',
          minHeight: 120,
          padding: 16,
        }}
      >
        <span style={{ fontSize: '0.875rem' }}>Превью недоступно</span>
        <a
          href={originalSrc ?? src}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.875rem', color: 'var(--accent)', textDecoration: 'underline' }}
        >
          Открыть изображение в новой вкладке
        </a>
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        onClick={handleClick}
      />
      {overlay}
    </>
  );
}

