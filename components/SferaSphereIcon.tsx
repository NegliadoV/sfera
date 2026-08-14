'use client';

import { useId, memo } from 'react';
import { getSphereColorPreset } from '@/lib/sphere-colors';

interface SferaSphereIconProps {
  /** sm — 32px, md — 56px, lg — 80px */
  size?: 'sm' | 'md' | 'lg';
  color?: string | null;
  icon?: string | null;
  name?: string | null;
  className?: string;
}

type CategoryType = 'quantum' | 'philosophy' | 'gossip' | 'embroidery' | 'urbanism' | 'sea' | 'cosmic' | 'generic';

function detectCategory(name?: string | null, icon?: string | null): CategoryType {
  if (icon && (icon.startsWith('http') || icon.startsWith('/'))) return 'generic';
  const str = (name || icon || '').toLowerCase();
  if (str.includes('квант') || str.includes('физик') || str.includes('наук')) return 'quantum';
  if (str.includes('философ') || str.includes('сознан') || str.includes('разум')) return 'philosophy';
  if (str.includes('сплетн') || str.includes('чат') || str.includes('дискусс')) return 'gossip';
  if (str.includes('вышив') || str.includes('творчест') || str.includes('дизайн')) return 'embroidery';
  if (str.includes('урбан') || str.includes('город') || str.includes('архитект')) return 'urbanism';
  if (str.includes('мор') || str.includes('океан') || str.includes('вод')) return 'sea';
  if (str.includes('космос') || str.includes('звезд') || str.includes('галактик')) return 'cosmic';
  return 'generic';
}

export const SferaSphereIcon = memo(function SferaSphereIcon({
  size = 'md',
  color = null,
  icon = null,
  name = null,
  className = '',
}: SferaSphereIconProps) {
  const pixelSize = size === 'sm' ? 32 : size === 'lg' ? 80 : 56;
  const preset = getSphereColorPreset(color);
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const category = detectCategory(name, icon);

  // Если передана прямая ссылка на SVG или картинку (например, векторизованный файл из Vectorizer.ai)
  if (icon && (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('/') || icon.endsWith('.svg'))) {
    return (
      <div
        className={`room-icon-wrapper relative group transition-transform duration-300 hover:scale-110 flex items-center justify-center flex-shrink-0 select-none ${className}`}
        style={{
          width: pixelSize,
          height: pixelSize,
          borderRadius: '50%',
          filter: `drop-shadow(0 8px 24px ${preset.glow}75)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={icon}
          alt={name || 'Комната'}
          className="w-full h-full object-contain rounded-full transition-transform duration-500 group-hover:scale-110"
        />
      </div>
    );
  }

  const gradId = preset.highlight.replace('#', '') + preset.dark.replace('#', '') + uid;

  return (
    <div
      className={`room-portal-icon relative group transition-transform duration-300 hover:scale-110 flex items-center justify-center flex-shrink-0 select-none ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        filter: `drop-shadow(0 8px 24px ${preset.glow}75)`,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 40 40"
        style={{ overflow: 'visible' }}
        suppressHydrationWarning
      >
        <defs>
          {/* Объемный 3D Градиент Сферы */}
          <radialGradient id={`sphereGrad-${gradId}`} cx="35%" cy="28%" r="68%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="25%" stopColor={preset.highlight} stopOpacity="1" />
            <stop offset="65%" stopColor={preset.mid} stopOpacity="0.9" />
            <stop offset="90%" stopColor={preset.dark} stopOpacity="0.95" />
            <stop offset="100%" stopColor="#050810" stopOpacity="1" />
          </radialGradient>

          {/* Внешнее космическое ореоло */}
          <radialGradient id={`haloGrad-${gradId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={preset.glow} stopOpacity="0.8" />
            <stop offset="60%" stopColor={preset.glow} stopOpacity="0.3" />
            <stop offset="100%" stopColor={preset.glow} stopOpacity="0" />
          </radialGradient>

          {/* Неоновый градиент колец и контуров */}
          <linearGradient id={`ringGrad-${gradId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="50%" stopColor={preset.highlight} stopOpacity="0.8" />
            <stop offset="100%" stopColor={preset.mid} stopOpacity="0.2" />
          </linearGradient>

          {/* Фильтр размытия свечения */}
          <filter id={`glow-${gradId}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Атмосферное ореоло-свечение */}
        <circle cx="20" cy="20" r="19" fill={`url(#haloGrad-${gradId})`} />

        {/* 2. Задняя дуга Сатурнианского Кольца */}
        <ellipse
          cx="20"
          cy="20"
          rx="17.5"
          ry="6"
          fill="none"
          stroke={`url(#ringGrad-${gradId})`}
          strokeWidth="1.2"
          strokeDasharray="4 2"
          transform="rotate(-25 20 20)"
          opacity="0.5"
        />

        {/* 3. Основная 3D Сфера Стеклянного Тела */}
        <circle
          cx="20"
          cy="20"
          r="13.5"
          fill={`url(#sphereGrad-${gradId})`}
          filter={`url(#glow-${gradId})`}
        />

        {/* 4. ВЕКТОРНАЯ 3D АРТ-ГРАФИКА КАТЕГОРИИ */}
        {category === 'quantum' && (
          <g filter={`url(#glow-${gradId})`}>
            <ellipse cx="20" cy="20" rx="10" ry="3.5" fill="none" stroke="#ffffff" strokeWidth="1.2" transform="rotate(0 20 20)" opacity="0.9" />
            <ellipse cx="20" cy="20" rx="10" ry="3.5" fill="none" stroke="#ffffff" strokeWidth="1.2" transform="rotate(60 20 20)" opacity="0.9" />
            <ellipse cx="20" cy="20" rx="10" ry="3.5" fill="none" stroke="#ffffff" strokeWidth="1.2" transform="rotate(120 20 20)" opacity="0.9" />
            <circle cx="20" cy="20" r="3" fill="#ffffff" />
            <circle cx="20" cy="20" r="4.5" fill={preset.highlight} opacity="0.5" />
            <circle cx="27" cy="16" r="1.2" fill="#ffffff" />
            <circle cx="13" cy="24" r="1.2" fill="#ffffff" />
          </g>
        )}

        {category === 'philosophy' && (
          <g filter={`url(#glow-${gradId})`}>
            {/* Нейронный мозг — Векторный кортекс */}
            <path
              d="M 16 16 C 14 13 18 11 20 12 C 22 11 26 13 24 16 C 27 18 25 22 23 23 C 21 24 19 24 17 23 C 15 22 13 18 16 16 Z"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path d="M 20 12 L 20 23" stroke="#ffffff" strokeWidth="1" strokeDasharray="1.5 1.5" />
            <circle cx="17" cy="15" r="1" fill="#ffffff" />
            <circle cx="23" cy="15" r="1" fill="#ffffff" />
            <circle cx="16" cy="19" r="1" fill="#ffffff" />
            <circle cx="24" cy="19" r="1" fill="#ffffff" />
            <circle cx="20" cy="20" r="2.5" fill="#ffffff" opacity="0.9" />
          </g>
        )}

        {category === 'urbanism' && (
          <g filter={`url(#glow-${gradId})`}>
            {/* 3D Стеклянный Город 80-х */}
            <circle cx="20" cy="16" r="5" fill="#ffffff" opacity="0.8" />
            <rect x="11" y="19" width="3" height="7" fill="#ffffff" opacity="0.9" />
            <rect x="15" y="16" width="3.5" height="10" fill="#ffffff" opacity="0.95" />
            <rect x="19.5" y="14" width="4" height="12" fill="#ffffff" />
            <rect x="24" y="17" width="3.5" height="9" fill="#ffffff" opacity="0.9" />
            <line x1="9" y1="26" x2="31" y2="26" stroke="#ffffff" strokeWidth="1.2" />
          </g>
        )}

        {category === 'gossip' && (
          <g filter={`url(#glow-${gradId})`}>
            {/* 3D Чат-облака */}
            <path
              d="M 12 18 C 12 14 20 14 20 18 C 20 21 16 22 14 23 L 13 21 C 12 20 12 19 12 18 Z"
              fill="#ffffff"
              opacity="0.9"
            />
            <path
              d="M 20 21 C 20 18 27 18 27 21 C 27 24 23 25 22 26 L 21 24.5 C 20 24 20 22 20 21 Z"
              fill={preset.highlight}
              stroke="#ffffff"
              strokeWidth="0.8"
            />
            <circle cx="15" cy="17.5" r="0.8" fill="#000000" />
            <circle cx="17" cy="17.5" r="0.8" fill="#000000" />
          </g>
        )}

        {category === 'embroidery' && (
          <g filter={`url(#glow-${gradId})`}>
            {/* Иглы и Нити Рукоделия */}
            <path d="M 13 27 L 27 13" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M 27 27 L 13 13" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="20" cy="20" r="6" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="2 1.5" />
            <circle cx="20" cy="20" r="2" fill="#ffffff" />
          </g>
        )}

        {category === 'sea' && (
          <g filter={`url(#glow-${gradId})`}>
            {/* Океанические Волны */}
            <path d="M 11 16 Q 15.5 13 20 16 T 29 16" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M 11 20 Q 15.5 17 20 20 T 29 20" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
            <path d="M 13 24 Q 16.5 22 20 24 T 27 24" fill="none" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
          </g>
        )}

        {category === 'cosmic' && (
          <g filter={`url(#glow-${gradId})`}>
            {/* Спиральная Галактика */}
            <path d="M 20 20 C 24 16 28 17 28 20 C 28 24 22 27 18 26 C 13 25 11 20 13 16 C 15 11 22 10 27 13" fill="none" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="20" cy="20" r="3" fill="#ffffff" />
            <circle cx="20" cy="20" r="5" fill={preset.highlight} opacity="0.5" />
          </g>
        )}

        {category === 'generic' && (
          <g filter={`url(#glow-${gradId})`}>
            {/* Универсальная 3D Звезда / Квазар */}
            <path d="M 20 11 L 22.5 17.5 L 29 20 L 22.5 22.5 L 20 29 L 17.5 22.5 L 11 20 L 17.5 17.5 Z" fill="#ffffff" />
            <circle cx="20" cy="20" r="2" fill={preset.highlight} />
          </g>
        )}

        {/* 5. Верхний стеклянный 3D Блик */}
        <path
          d="M 12 11.5 A 9.5 9.5 0 0 1 25 9.5"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* 6. Передняя дуга Сатурнианского Кольца */}
        <ellipse
          cx="20"
          cy="20"
          rx="17.5"
          ry="6"
          fill="none"
          stroke={`url(#ringGrad-${gradId})`}
          strokeWidth="1.5"
          transform="rotate(-25 20 20)"
          strokeDasharray="18 12"
          opacity="0.95"
        />
      </svg>
    </div>
  );
});

