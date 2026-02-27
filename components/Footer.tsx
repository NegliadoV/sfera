import Link from 'next/link';

export function Footer() {
  return (
    <footer
      className="footer-mobile"
      style={{
        borderTop: '1px solid rgba(255,255,255,0.04)',
        padding: '18px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap',
        background: 'var(--studio-footer-bg)',
        color: 'var(--studio-footer-color, #859dbf)',
        fontSize: '0.85rem',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <i className="fas fa-cube" aria-hidden style={{ color: 'var(--studio-ctrl-icon)' }} />
        SFERA — Вселенные знания
      </span>
      <Link href="/about" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <i className="fas fa-scale-balanced" aria-hidden />
        Правила сообщества
      </Link>
      <span className="footer-status" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '60px',
            background: 'var(--studio-status-live-bg)',
            border: '1px solid var(--studio-status-live-border)',
            color: 'var(--studio-status-live-color)',
            fontWeight: 500,
            fontSize: '0.8rem',
          }}
        >
          <i className="fas fa-circle-check" aria-hidden style={{ fontSize: '0.65rem' }} />
          Все системы работают
        </span>
      </span>
    </footer>
  );
}
