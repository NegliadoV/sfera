'use client';

import { useTranslation } from '@/components/i18n/LanguageProvider';

interface ExploreHeroProps {
  isLoggedIn: boolean;
  userName?: string | null;
  showWelcome?: boolean;
}

export function ExploreHero({ isLoggedIn, userName, showWelcome }: ExploreHeroProps) {
  const { t } = useTranslation();

  return (
    <>
      {showWelcome && (
        <div className="platform-card mb-4 overflow-hidden relative" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(124,58,237,0.15))', border: '1px solid rgba(37,99,235,0.3)' }}>
          <div className="relative z-10 flex items-center gap-4">
            <div style={{ fontSize: 36 }}>🎉</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>
                {t('explore.welcome', 'Добро пожаловать в Roominate')}{userName ? `, ${userName.split(' ')[0]}` : ''}!
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
                {t('explore.welcomeDesc', 'Лента персонализирована под твои интересы. Изучай материалы, вступай в обсуждения и слушай аудио-комнаты 🚀')}
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="platform-card mb-6 overflow-hidden relative">
        <div className="absolute inset-0 z-0 opacity-20" style={{ background: 'radial-gradient(circle at top right, var(--accent-primary), transparent 60%)' }}></div>
        <div className="relative z-10">
          <h1 className="platform-hero-title" style={{ fontSize: '2rem', marginBottom: 8 }}>
            <i
              className="fa-solid fa-fire mr-3"
              style={{
                color: 'var(--accent-primary)',
                WebkitTextFillColor: 'var(--accent-primary)',
                backgroundClip: 'unset',
                WebkitBackgroundClip: 'unset',
                background: 'none',
                display: 'inline-block',
                transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), filter 0.3s ease, color 0.3s ease',
              }}
            />
            {isLoggedIn ? t('explore.forYou', 'Для тебя') : t('explore.trending', 'В тренде')}
          </h1>
          <p className="platform-card-desc">
            {isLoggedIn
              ? t('explore.feedDesc', 'Лучшие материалы из твоих сфер и со всей платформы — подобраны алгоритмом.')
              : t('explore.feedDescGuest', 'Лучшие материалы со всех Сфер, подобранные по свежести и популярности.')}
          </p>
        </div>
      </div>
    </>
  );
}

export function ExploreEmpty() {
  const { t } = useTranslation();
  return (
    <p className="platform-card-desc">
      {t('explore.noContent', 'Пока нет материалов.')}
    </p>
  );
}
