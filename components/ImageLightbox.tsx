'use client';

import { useState, MouseEvent, CSSProperties } from 'react';
import { createPortal } from 'react-dom';

type ImageLightboxProps = {
  src: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
};

export function ImageLightbox({ src, alt = '', className = '', style }: ImageLightboxProps) {
  const [open, setOpen] = useState(false);

  const handleClick = (e: MouseEvent<HTMLImageElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
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
        onClick={handleClick}
      />
      {overlay}
    </>
  );
}

