'use client';

import { useState, MouseEvent, CSSProperties } from 'react';
import { createPortal } from 'react-dom';

type ImageLightboxProps = {
  src: string;
  originalSrc?: string | null;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  onError?: () => void;
};

/** Красивая заглушка когда картинка не загрузилась */
function ImagePlaceholder({ alt, className, style }: { alt: string; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        ...style,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
        letterSpacing: '0.03em',
        textAlign: 'center',
        padding: '12px 8px',
        minHeight: 80,
        overflow: 'hidden',
        position: 'relative',
      }}
      aria-label={alt}
    >
      {/* Декоративный паттерн */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.5 }}
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
      <span style={{ opacity: 0.6, maxWidth: 120, lineHeight: 1.3 }}>
        {alt && alt.length > 40 ? alt.slice(0, 40) + '…' : alt || 'Изображение недоступно'}
      </span>
    </div>
  );
}

export function ImageLightbox({
  src,
  originalSrc,
  alt = '',
  className = '',
  style,
  onError: onErrorProp,
}: ImageLightboxProps) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

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
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(8px)',
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
                src={originalSrc ?? src}
                alt={alt}
                referrerPolicy="no-referrer"
                style={{
                  maxWidth: '95vw',
                  maxHeight: '95vh',
                  borderRadius: 12,
                  boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </>,
          document.body
        )
      : null;

  if (failed) {
    return <ImagePlaceholder alt={alt} className={className} style={style} />;
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={className}
        style={{
          ...style,
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        suppressHydrationWarning
        onLoad={() => setLoaded(true)}
        onError={() => {
          setFailed(true);
          onErrorProp?.();
        }}
        onClick={handleClick}
      />
      {overlay}
    </>
  );
}
