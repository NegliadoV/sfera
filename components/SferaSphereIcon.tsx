'use client';

import { useId } from 'react';
import { getSphereColorPreset } from '@/lib/sphere-colors';

interface SferaSphereIconProps {
  /** sm — для кабинета (48px), md — для каталога сфер (96px) */
  size?: 'sm' | 'md';
  /** Индекс пресета (0–7) или hex — оттенок сферы. По умолчанию первый пресет. */
  color?: string | null;
  className?: string;
}

export function SferaSphereIcon({ size = 'md', color = null, className = '' }: SferaSphereIconProps) {
  const isSm = size === 'sm';
  const h = isSm ? 28 : 48;
  const w = h;
  const preset = getSphereColorPreset(color);
  const uid = useId().replace(/:/g, '');
  
  // Уникальный ID для градиентов
  const gradId = preset.highlight.replace('#', '') + preset.dark.replace('#', '') + uid;

  return (
    <div
      className={`room-portal-icon group ${className}`}
      style={{
        width: w,
        height: h,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 24 24" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`grad-${gradId}`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={preset.highlight} />
            <stop offset="50%" stopColor={preset.mid} />
            <stop offset="100%" stopColor={preset.dark} />
          </linearGradient>
          <filter id={`glow-${gradId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g filter={`url(#glow-${gradId})`}>
           {/* Чистая геометрическая сфера (Кольца и орбиты) */}
           <circle cx="12" cy="12" r="9" stroke={`url(#grad-${gradId})`} strokeWidth="1.5" fill="none" opacity="0.9" />
           <ellipse cx="12" cy="12" rx="4" ry="9" stroke={`url(#grad-${gradId})`} strokeWidth="1.2" fill="none" opacity="0.6" />
           <path d="M3 12H21" stroke={`url(#grad-${gradId})`} strokeWidth="1.2" opacity="0.6" />
           
           {/* Яркое энергетическое ядро портала */}
           <circle cx="12" cy="12" r="2.5" fill={`url(#grad-${gradId})`} />
           <circle cx="12" cy="12" r="1" fill="#ffffff" opacity="0.8" />
        </g>
      </svg>
    </div>
  );
}
