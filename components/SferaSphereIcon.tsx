'use client';

import { memo } from 'react';

interface SferaSphereIconProps {
  /** sm — 32px, md — 56px, lg — 80px */
  size?: 'sm' | 'md' | 'lg';
  color?: string | null;
  icon?: string | null;
  name?: string | null;
  className?: string;
}

// Telegram-like vibrant gradient pairs
const TELEGRAM_GRADIENTS = [
  'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', // Indigo -> Purple
  'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', // Cyan -> Blue
  'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)', // Pink -> Rose
  'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Emerald -> Green
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', // Amber -> Orange
  'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', // Violet -> Indigo
  'linear-gradient(135deg, #14b8a6 0%, #0284c7 100%)', // Teal -> Sky
  'linear-gradient(135deg, #ff007a 0%, #7928ca 100%)', // Neon Pink -> Purple
];

function getTelegramGradient(name?: string | null, color?: string | null): string {
  if (color && color.startsWith('linear-gradient')) return color;
  const str = name || 'room';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TELEGRAM_GRADIENTS.length;
  return TELEGRAM_GRADIENTS[index];
}

function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'К';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

function getStandardIcon(name?: string | null): string | null {
  const str = (name || '').toLowerCase();
  if (str.includes('квант') || str.includes('физик') || str.includes('наук')) return 'fa-atom';
  if (str.includes('философ') || str.includes('сознан') || str.includes('разум')) return 'fa-brain';
  if (str.includes('сплетн') || str.includes('чат') || str.includes('дискусс')) return 'fa-comments';
  if (str.includes('вышив') || str.includes('творчест') || str.includes('дизайн')) return 'fa-palette';
  if (str.includes('урбан') || str.includes('город') || str.includes('архитект')) return 'fa-city';
  if (str.includes('мор') || str.includes('океан') || str.includes('вод')) return 'fa-water';
  if (str.includes('космос') || str.includes('звезд') || str.includes('галактик')) return 'fa-icons';
  return null;
}

export const SferaSphereIcon = memo(function SferaSphereIcon({
  size = 'md',
  color = null,
  icon = null,
  name = null,
  className = '',
}: SferaSphereIconProps) {
  const pixelSize = size === 'sm' ? 36 : size === 'lg' ? 72 : 52;
  const fontSize = size === 'sm' ? '0.85rem' : size === 'lg' ? '1.75rem' : '1.25rem';
  const iconSize = size === 'sm' ? '1rem' : size === 'lg' ? '2.2rem' : '1.5rem';

  const isCustomPhoto = icon && (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('/') || icon.endsWith('.png') || icon.endsWith('.jpg') || icon.endsWith('.svg'));
  const gradient = getTelegramGradient(name, color);
  const stdIconClass = getStandardIcon(name);
  const initials = getInitials(name);

  // 1. Если загружена своя фотка (как в Telegram)
  if (isCustomPhoto) {
    return (
      <div
        className={`telegram-room-avatar relative group transition-transform duration-200 hover:scale-105 flex items-center justify-center flex-shrink-0 select-none overflow-hidden rounded-full ${className}`}
        style={{
          width: pixelSize,
          height: pixelSize,
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.15)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={icon}
          alt={name || 'Аватар комнаты'}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>
    );
  }

  // 2. Стандартный Telegram-стиль (Яркий градиентный круг с иконкой или инициалами)
  return (
    <div
      className={`telegram-room-avatar relative group transition-transform duration-200 hover:scale-105 flex items-center justify-center flex-shrink-0 select-none rounded-full text-white font-bold ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        background: gradient,
        boxShadow: '0 6px 18px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.35)',
      }}
    >
      {stdIconClass ? (
        <i className={`fas ${stdIconClass} transition-transform duration-300 group-hover:scale-110`} style={{ fontSize: iconSize }} />
      ) : (
        <span style={{ fontSize, letterSpacing: '0.02em', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
          {initials}
        </span>
      )}
    </div>
  );
});
