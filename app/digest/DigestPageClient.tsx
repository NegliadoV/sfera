'use client';

import Link from 'next/link';
import { useTranslation } from '@/components/i18n/LanguageProvider';
import { DigestContent } from '@/components/DigestContent';

export function DigestPageClient() {
  const { t } = useTranslation();

  return (
    <div className="platform-page">
      <div className="platform-breadcrumb mb-6">
        <Link href="/">
          <i className="fa-solid fa-globe" style={{ marginRight: 4 }} /> Roominate
        </Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>{t('nav.digest', 'Дайджест')}</span>
      </div>

      <div className="platform-card mb-8">
        <div className="platform-card-title" style={{ marginBottom: 8 }}>
          <i className="fa-solid fa-newspaper" aria-hidden />
          {t('nav.digest', 'Дайджест')}
          <span className="platform-tag" style={{ marginLeft: 'auto' }}>
            {t('digest.last24h', 'За 24 часа')}
          </span>
        </div>
        <p className="platform-card-desc mb-6">
          <i className="fa-regular fa-message" style={{ marginRight: 6 }} aria-hidden />
          {t('digest.description', 'Новый контент за последние 24 часа в сферах, которыми вы владеете, в которых участвуете или отслеживаете.')}
        </p>

        <DigestContent />

        <div className="digest-schedule-info" style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
          <div className="digest-schedule-item">
            <i className="fa-regular fa-bell" aria-hidden />
            <span>
              {t('digest.configureIn', 'Настройте рассылку в')}{' '}
              <Link href="/settings" style={{ color: 'var(--accent-primary-muted)', textDecoration: 'underline' }}>
                {t('nav.settings', 'Настройках')}
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
