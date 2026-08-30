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
  /** Вызывается когда изображение не удалось загрузить */
  onError?: () => void;
};

export function ImageLightbox({ src, originalSrc, alt = '', className = '', style, onError: onErrorProp }: ImageLightboxProps) {
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
    return null;
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className={className}
        style={{
          ...style,
          // Скрываем изображение пока оно не загружено — браузер не рисует broken-img placeholder
          opacity: 0,
          transition: 'opacity 0.3s ease',
        }}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={(e) => {
          // Показываем плавно только после успешной загрузки
          (e.target as HTMLImageElement).style.opacity = '1';
        }}
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

