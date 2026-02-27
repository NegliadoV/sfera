'use client';

import Link from 'next/link';

interface SferaLogoProps {
  /** Компактный режим для хедера */
  compact?: boolean;
  href?: string;
}

export function SferaLogo({ compact = true, href = '/' }: SferaLogoProps) {
  const sphereSize = compact ? 32 : 52;
  const textSize = compact ? '1.25rem' : '2rem';
  const wrapSize = compact ? 56 : 90;
  const r1 = sphereSize + (compact ? 10 : 16);
  const r2 = sphereSize + (compact ? 20 : 28);
  const r3 = sphereSize + (compact ? 30 : 40);
  const portalSize = compact ? 5 : 10;

  const content = (
    <div
      className="sfera-logo"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 10 : 16,
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div
        className="sfera-logo-sphere-wrap"
        style={{
          position: 'relative',
          width: wrapSize,
          height: wrapSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {/* Центральная сфера */}
        <div
          className="sfera-logo-sphere"
          style={{
            width: sphereSize,
            height: sphereSize,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, color-mix(in srgb, var(--accent-primary-muted) 30%, white), var(--accent-primary) 70%, color-mix(in srgb, var(--accent-primary) 60%, black))',
            boxShadow: '0 0 20px var(--accent-primary-muted), 0 0 10px color-mix(in srgb, var(--accent-primary-muted) 50%, transparent) inset, -4px -4px 12px rgba(0,0,0,0.5) inset, 2px 2px 15px rgba(255,255,255,0.4) inset',
            border: '1.5px solid color-mix(in srgb, var(--accent-primary-muted) 60%, transparent)',
            position: 'relative',
            zIndex: 10,
          }}
        />
        {/* Орбиты (кольца) */}
        <div
          className="sfera-logo-ring sfera-logo-ring-1"
          style={{
            position: 'absolute',
            width: r1,
            height: r1,
            borderRadius: '50%',
            border: '1px solid color-mix(in srgb, var(--accent-primary-muted) 35%, transparent)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 5,
          }}
        />
        <div
          className="sfera-logo-ring sfera-logo-ring-2"
          style={{
            position: 'absolute',
            width: r2,
            height: r2,
            borderRadius: '50%',
            border: '1px dashed color-mix(in srgb, var(--accent-primary-muted) 25%, transparent)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 4,
          }}
        />
        <div
          className="sfera-logo-ring sfera-logo-ring-3"
          style={{
            position: 'absolute',
            width: r3,
            height: r3,
            borderRadius: '50%',
            border: '1px dotted color-mix(in srgb, var(--accent-primary) 25%, transparent)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 3,
          }}
        />
        {/* Маленькие порталы — оттенки палитры приложения */}
        <div
          className="sfera-logo-portal sfera-logo-portal-1"
          style={{
            position: 'absolute',
            width: portalSize,
            height: portalSize,
            borderRadius: '50%',
            background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-primary-muted) 50%, white), var(--accent-primary-muted))',
            boxShadow: '0 0 8px var(--accent-primary-muted)',
            top: compact ? '5%' : '0%',
            left: compact ? '55%' : '60%',
            zIndex: 6,
          }}
        />
        <div
          className="sfera-logo-portal sfera-logo-portal-2"
          style={{
            position: 'absolute',
            width: portalSize + (compact ? 1 : 2),
            height: portalSize + (compact ? 1 : 2),
            borderRadius: '50%',
            background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-primary) 50%, white), var(--accent-primary))',
            boxShadow: '0 0 10px var(--accent-primary-muted)',
            bottom: compact ? '5%' : '2%',
            left: compact ? '12%' : '10%',
            zIndex: 6,
          }}
        />
        <div
          className="sfera-logo-portal sfera-logo-portal-3"
          style={{
            position: 'absolute',
            width: portalSize - (compact ? 1 : 0),
            height: portalSize - (compact ? 1 : 0),
            borderRadius: '50%',
            background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-purple) 50%, white), var(--accent-purple))',
            boxShadow: '0 0 6px var(--accent-purple)',
            top: compact ? '25%' : '20%',
            left: compact ? '0%' : '-2%',
            zIndex: 6,
          }}
        />
        <div
          className="sfera-logo-portal sfera-logo-portal-4"
          style={{
            position: 'absolute',
            width: portalSize + (compact ? 2 : 4),
            height: portalSize + (compact ? 2 : 4),
            borderRadius: '50%',
            background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-primary-muted) 60%, white), color-mix(in srgb, var(--accent-primary) 80%, var(--accent-green)))',
            boxShadow: '0 0 12px var(--accent-primary-muted)',
            bottom: compact ? '15%' : '15%',
            right: compact ? '0%' : '-2%',
            zIndex: 6,
          }}
        />
        <div
          className="sfera-logo-portal sfera-logo-portal-5"
          style={{
            position: 'absolute',
            width: portalSize - (compact ? 1 : 2),
            height: portalSize - (compact ? 1 : 2),
            borderRadius: '50%',
            background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-primary-muted) 60%, white), var(--accent-primary))',
            boxShadow: '0 0 6px var(--accent-primary)',
            top: '48%',
            right: compact ? '2%' : '0%',
            zIndex: 6,
          }}
        />
      </div>
      <span
        className="sfera-logo-text"
        style={{
          fontFamily: 'var(--font-brand)',
          fontSize: textSize,
          fontWeight: 900,
          letterSpacing: compact ? '0.02em' : '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          lineHeight: 0.9,
        }}
      >
        SFERA
      </span>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="sfera-logo-link"
        style={{ textDecoration: 'none', display: 'inline-flex' }}
      >
        {content}
      </Link>
    );
  }
  return content;
}
