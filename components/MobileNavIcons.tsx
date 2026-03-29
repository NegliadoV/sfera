import React, { useId } from 'react';

const GlowDefs = ({ uid }: { uid: string }) => (
  <defs>
    <linearGradient id={`neonGlowNav-${uid}`} x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="var(--accent-primary, #0ea5e9)" />
      <stop offset="50%" stopColor="var(--accent-purple, #a855f7)" />
      <stop offset="100%" stopColor="var(--text-primary, #f43f5e)" />
    </linearGradient>
    <filter id={`iconGlowNav-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="1.2" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
);

export function ExploreIcon({ size = 26 }: { size?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
      <GlowDefs uid={uid} />
      <g filter={`url(#iconGlowNav-${uid})`}>
        {/* Компас / Радар */}
        <circle cx="12" cy="12" r="9" stroke={`url(#neonGlowNav-${uid})`} strokeWidth="1.5" fill="none" />
        <path d="M10.5 10.5 L15.5 8.5 L13.5 13.5 L8.5 15.5 Z" stroke={`url(#neonGlowNav-${uid})`} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="1.5" fill={`url(#neonGlowNav-${uid})`} />
      </g>
    </svg>
  );
}

export function CreateIcon({ size = 26 }: { size?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
      <GlowDefs uid={uid} />
      <g filter={`url(#iconGlowNav-${uid})`}>
        {/* Скругленный квадрат (Скворкл) и утолщенный плюс */}
        <rect x="3" y="3" width="18" height="18" rx="6" stroke={`url(#neonGlowNav-${uid})`} strokeWidth="2" fill="none" />
        <path d="M12 8 V16 M8 12 H16" stroke={`url(#neonGlowNav-${uid})`} strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function MessagesIcon({ size = 26 }: { size?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
      <GlowDefs uid={uid} />
      <g filter={`url(#iconGlowNav-${uid})`}>
        {/* Округлые пузыри чата (Chat bubbles) */}
        <path d="M7 8C7 5.79086 8.79086 4 11 4H17C19.2091 4 21 5.79086 21 8V12C21 14.2091 19.2091 16 17 16H15.5L12.5 19V16H11C8.79086 16 7 14.2091 7 12V8Z" stroke={`url(#neonGlowNav-${uid})`} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Фоновый пузырек (сзади) */}
        <path d="M7 16H6C4.89543 16 4 15.1046 4 14V11" stroke={`url(#neonGlowNav-${uid})`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        {/* Три точки набора текста */}
        <circle cx="11" cy="10" r="1.2" fill={`url(#neonGlowNav-${uid})`} />
        <circle cx="14" cy="10" r="1.2" fill={`url(#neonGlowNav-${uid})`} />
        <circle cx="17" cy="10" r="1.2" fill={`url(#neonGlowNav-${uid})`} />
      </g>
    </svg>
  );
}

export function ProfileIcon({ size = 26, avatarUrl }: { size?: number, avatarUrl?: string | null }) {
  const uid = useId().replace(/:/g, '');
  if (avatarUrl) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', padding: 2, background: 'linear-gradient(135deg, var(--accent-primary, #0ea5e9), var(--accent-purple, #a855f7))', boxShadow: '0 0 8px rgba(168,85,247,0.6)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl} alt="Профиль" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', background: '#000' }} />
      </div>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
      <GlowDefs uid={uid} />
      <g filter={`url(#iconGlowNav-${uid})`}>
        {/* Минималистичный силуэт профиля */}
        <circle cx="12" cy="7" r="4" stroke={`url(#neonGlowNav-${uid})`} strokeWidth="1.5" fill="none" />
        <path d="M4 21 C4 16.5 7.58 13 12 13 C16.42 13 20 16.5 20 21" stroke={`url(#neonGlowNav-${uid})`} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}

export function MenuIcon({ size = 26 }: { size?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
      <GlowDefs uid={uid} />
      {/* Используем rect вместо горизонтальных path, чтобы WebKit (iOS) корректно считал размеры 
          для наложения SVG-фильтра свечения. */}
      <g filter={`url(#iconGlowNav-${uid})`}>
        <rect x="4" y="6" width="16" height="2" rx="1" fill={`url(#neonGlowNav-${uid})`} />
        <rect x="4" y="11" width="12" height="2" rx="1" fill={`url(#neonGlowNav-${uid})`} />
        <rect x="4" y="16" width="16" height="2" rx="1" fill={`url(#neonGlowNav-${uid})`} />
      </g>
    </svg>
  );
}
