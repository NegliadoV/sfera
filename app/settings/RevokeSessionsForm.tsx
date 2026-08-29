'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useTranslation } from '@/components/i18n/LanguageProvider';

type State = 'idle' | 'loading' | 'done' | 'error';

/**
 * RevokeSessionsForm — кнопка «Выйти со всех устройств».
 * Инкрементирует sessionVersion в БД, после чего все
 * JWT-токены на других устройствах становятся невалидными.
 * Текущий пользователь тоже разлогинивается (signOut).
 */
export function RevokeSessionsForm() {
  const { t } = useTranslation();
  const [state, setState] = useState<State>('idle');

  const handleRevoke = async () => {
    if (state === 'loading') return;
    if (!confirm(t('security.confirmRevoke', 'Вы уверены? Вы выйдете из аккаунта на всех устройствах, включая это.'))) return;

    setState('loading');
    try {
      const res = await fetch('/api/auth/revoke-sessions', { method: 'POST' });
      if (!res.ok) throw new Error('server error');
      setState('done');
      await signOut({ callbackUrl: '/auth/signin' });
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  };

  return (
    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button
        id="revoke-all-sessions-btn"
        onClick={handleRevoke}
        disabled={state === 'loading' || state === 'done'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 20px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          background: 'rgba(239, 68, 68, 0.08)',
          color: state === 'loading' ? 'var(--text-muted)' : '#ef4444',
          fontWeight: 600,
          fontSize: '0.9rem',
          cursor: state === 'loading' ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          width: 'fit-content',
          opacity: state === 'loading' ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (state !== 'loading') {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.16)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.55)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
        }}
      >
        {state === 'loading' ? (
          <>
            <i className="fas fa-circle-notch fa-spin" />
            {t('security.signingOut', 'Выход...')}
          </>
        ) : state === 'done' ? (
          <>
            <i className="fas fa-check" style={{ color: 'var(--accent-green)' }} />
            {t('common.saved', 'Готово')}
          </>
        ) : (
          <>
            <i className="fas fa-right-from-bracket" />
            {t('security.revokeAll', 'Выйти со всех устройств')}
          </>
        )}
      </button>

      {state === 'error' && (
        <p style={{ fontSize: '0.85rem', color: '#ef4444', margin: 0 }}>
          <i className="fas fa-triangle-exclamation" style={{ marginRight: 6 }} />
          {t('common.error', 'Не удалось выполнить операцию. Попробуйте снова.')}
        </p>
      )}

      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
        {t('security.revokeDesc', 'Все активные сессии на других устройствах будут немедленно завершены. Вам потребуется войти заново.')}
      </p>
    </div>
  );
}
