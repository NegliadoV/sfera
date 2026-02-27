'use client';

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
  const sphereSize = isSm ? 28 : 48;
  const preset = getSphereColorPreset(color);

  return (
    <div
      className={`sfera-sphere-icon ${className}`}
      style={{
        width: sphereSize,
        height: sphereSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <div
        className="sfera-sphere-icon-core"
        style={{
          width: sphereSize,
          height: sphereSize,
          borderRadius: '50%',
          background: `radial-gradient(circle at 40% 35%, ${preset.highlight}, ${preset.mid} 70%, ${preset.dark})`,
          boxShadow: `0 0 16px ${preset.glow}, 0 0 8px ${preset.highlight} inset, -3px -3px 10px rgba(0,0,0,0.5) inset, 2px 2px 12px rgba(255,255,255,0.4) inset`,
          border: '1.5px solid rgba(255, 255, 255, 0.5)',
        }}
      />
    </div>
  );
}
