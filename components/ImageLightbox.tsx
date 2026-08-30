'use client';

import { useState, useRef, MouseEvent, CSSProperties } from 'react';
import { createPortal } from 'react-dom';

type ImageLightboxProps = {
  src: string;
  /** Исходный URL для открытия в новой вкладке / прокси-fallback */
  originalSrc?: string | null;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  /** Вызывается когда изображение не удалось загрузить вообще */
  onError?: () => void;
};

/**
 * Возвращает URL через наш прокси — используется как fallback при ошибке загрузки.
 * Только клиентский код, не влияет на SSR.
 */
function getProxyUrl(url: string): string {
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
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
  // Попробовали ли мы уже прокси
  const triedProxy = useRef(false);

  const handleClick = (e: MouseEvent<HTMLImageElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!failed) setOpen(true);
  };

  const handleError = (e: MouseEvent<HTMLImageElement> | React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    const srcToProxy = originalSrc ?? src;

    // Первая попытка: пробуем прокси
    if (!triedProxy.current && srcToProxy && !img.src.includes('/api/proxy-image')) {
      triedProxy.current = true;
      img.src = getProxyUrl(srcToProxy);
      return;
    }

    // Обе попытки провалились — скрываем
    setFailed(true);
    onErrorProp?.();
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
        alt={alt}
        className={`${className} img-lazy-fade`}
        style={style}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={(e) => {
          (e.target as HTMLImageElement).setAttribute('data-loaded', 'true');
        }}
        onError={handleError}
        onClick={handleClick}
      />
      {overlay}
    </>
  );
}
