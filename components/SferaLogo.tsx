'use client';

import Link from 'next/link';
import { Logo } from './Logo';

interface SferaLogoProps {
  /** Компактный режим для хедера */
  compact?: boolean;
  href?: string;
}

export function SferaLogo({ compact = true, href = '/' }: SferaLogoProps) {
  const textSize = compact ? '1.75rem' : '3rem';
  const logoSize = compact ? 56 : 80;

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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Logo size={logoSize} />
      </div>
      <span
        className="sfera-logo-text"
        style={{
          fontFamily: 'var(--font-brand)',
          fontSize: textSize,
          fontWeight: 900,
          letterSpacing: compact ? '0.02em' : '0.05em',
          color: 'var(--text-primary)',
          lineHeight: 1,
        }}
      >
        ROOMINATE
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
