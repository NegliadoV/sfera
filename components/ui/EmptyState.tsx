'use client';

import Link from 'next/link';

interface EmptyStateProps {
  icon?: string;
  emoji?: string;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: string;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  variant?: 'default' | 'room' | 'mindmap' | 'feed';
}

const GRADIENT_MAP: Record<string, string> = {
  default:  'radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.12) 0%, transparent 70%)',
  room:     'radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.12) 0%, transparent 70%)',
  mindmap:  'radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.12) 0%, transparent 70%)',
  feed:     'radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.12) 0%, transparent 70%)',
};

const ICON_COLOR_MAP: Record<string, string> = {
  default:  '#60a5fa',
  room:     '#c084fc',
  mindmap:  '#fb923c',
  feed:     '#4ade80',
};

const ICON_BG_MAP: Record<string, string> = {
  default:  'rgba(37,99,235,0.15)',
  room:     'rgba(168,85,247,0.15)',
  mindmap:  'rgba(249,115,22,0.15)',
  feed:     'rgba(34,197,94,0.15)',
};

const BTN_GRADIENT_MAP: Record<string, string> = {
  default:  'linear-gradient(135deg, #2563eb, #1d4ed8)',
  room:     'linear-gradient(135deg, #9333ea, #7c3aed)',
  mindmap:  'linear-gradient(135deg, #ea580c, #dc2626)',
  feed:     'linear-gradient(135deg, #16a34a, #15803d)',
};

const BTN_SHADOW_MAP: Record<string, string> = {
  default:  '0 8px 24px rgba(37,99,235,0.35)',
  room:     '0 8px 24px rgba(147,51,234,0.35)',
  mindmap:  '0 8px 24px rgba(234,88,12,0.35)',
  feed:     '0 8px 24px rgba(22,163,74,0.35)',
};

export function EmptyState({
  icon,
  emoji,
  title,
  description,
  primaryAction,
  secondaryAction,
  variant = 'default',
}: EmptyStateProps) {
  const gradient = GRADIENT_MAP[variant];
  const iconColor = ICON_COLOR_MAP[variant];
  const iconBg = ICON_BG_MAP[variant];
  const btnGradient = BTN_GRADIENT_MAP[variant];
  const btnShadow = BTN_SHADOW_MAP[variant];

  return (
    <div style={{
      position: 'relative',
      textAlign: 'center',
      padding: '64px 24px 48px',
      borderRadius: 'var(--radius-xl, 20px)',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden',
    }}>
      {/* Glow background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: gradient,
        pointerEvents: 'none',
      }} />

      {/* Floating particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 4 + (i % 3) * 2,
            height: 4 + (i % 3) * 2,
            borderRadius: '50%',
            background: iconColor,
            opacity: 0.15 + (i % 4) * 0.05,
            top: `${15 + (i * 13) % 60}%`,
            left: `${8 + (i * 17) % 85}%`,
            animation: `es-float-${i % 3} ${3 + i}s ease-in-out infinite`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes es-float-0 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-8px)} }
        @keyframes es-float-1 { 0%,100%{transform:translateY(-4px)} 50%{transform:translateY(6px)} }
        @keyframes es-float-2 { 0%,100%{transform:translateY(4px)} 50%{transform:translateY(-6px)} }
        @keyframes es-pulse { 0%,100%{box-shadow:0 0 0 0 var(--es-color,#60a5fa)30} 50%{box-shadow:0 0 0 12px transparent} }
      `}</style>

      {/* Icon */}
      <div style={{
        position: 'relative',
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: iconBg,
        border: `1.5px solid ${iconColor}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px',
        fontSize: emoji ? 32 : 28,
        color: iconColor,
        boxShadow: `0 0 0 0 ${iconColor}40`,
        animation: 'es-pulse 2.5s ease-in-out infinite',
      }}>
        {emoji ? (
          <span>{emoji}</span>
        ) : (
          <i className={`fa-solid ${icon ?? 'fa-inbox'}`} />
        )}
      </div>

      {/* Text */}
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: 'var(--text-primary)',
        marginBottom: 10,
        position: 'relative',
      }}>
        {title}
      </h3>
      <p style={{
        color: 'var(--text-secondary)',
        fontSize: '0.95rem',
        lineHeight: 1.65,
        maxWidth: 420,
        margin: '0 auto 32px',
        position: 'relative',
      }}>
        {description}
      </p>

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'center',
          position: 'relative',
        }}>
          {primaryAction && (
            primaryAction.href ? (
              <Link
                href={primaryAction.href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: btnGradient,
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '12px 28px',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  boxShadow: btnShadow,
                  transition: 'transform .2s, box-shadow .2s',
                }}
              >
                {primaryAction.icon && <i className={`fa-solid ${primaryAction.icon}`} />}
                {primaryAction.label}
              </Link>
            ) : (
              <button
                onClick={primaryAction.onClick}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: btnGradient,
                  color: '#fff',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  boxShadow: btnShadow,
                  cursor: 'pointer',
                  transition: 'transform .2s',
                }}
              >
                {primaryAction.icon && <i className={`fa-solid ${primaryAction.icon}`} />}
                {primaryAction.label}
              </button>
            )
          )}

          {secondaryAction && (
            secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  padding: '12px 24px',
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  transition: 'background .2s',
                }}
              >
                {secondaryAction.label}
              </Link>
            ) : (
              <button
                onClick={secondaryAction.onClick}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-secondary)',
                  padding: '12px 24px',
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'background .2s',
                }}
              >
                {secondaryAction.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
