'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslation } from '@/components/i18n/LanguageProvider';
import { EmptyState } from '@/components/ui/EmptyState';

interface ExploreHeroProps {
  isLoggedIn: boolean;
  userName?: string | null;
  showWelcome?: boolean;
}

const QUICK_ACTIONS = [
  { icon: 'fa-shapes', color: '#60a5fa', bg: 'rgba(37,99,235,0.15)', label: 'Выбрать комнаты', sub: 'Подпишись по интересам', href: '/rooms' },
  { icon: 'fa-brain', color: '#fb923c', bg: 'rgba(249,115,22,0.15)', label: 'Карта мыслей', sub: 'Структурируй идеи', href: '/me/mind-maps' },
  { icon: 'fa-bolt', color: '#c084fc', bg: 'rgba(168,85,247,0.15)', label: 'Смотреть шортсы', sub: 'Видео за 60 сек', href: '/shorts' },
  { icon: 'fa-microphone', color: '#4ade80', bg: 'rgba(34,197,94,0.15)', label: 'Живые комнаты', sub: 'Аудио-дискуссии', href: '/rooms' },
];

export function ExploreHero({ isLoggedIn, userName, showWelcome }: ExploreHeroProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  return (
    <>
      {showWelcome && !dismissed && (
        <div style={{
          position: 'relative',
          marginBottom: 20,
          borderRadius: 20,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(124,58,237,0.12) 100%)',
          border: '1px solid rgba(37,99,235,0.25)',
          padding: '28px 24px 24px',
        }}>
          <button
            onClick={() => setDismissed(true)}
            style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
            aria-label="Закрыть"
          >
            <i className="fa-solid fa-xmark" />
          </button>
          <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 40, flexShrink: 0 }}>🎉</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
                {t('explore.welcome', 'Добро пожаловать в Roominate')}{userName ? `, ${userName.split(' ')[0]}` : ''}!
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                {t('explore.welcomeDesc', 'Лента персонализирована под твои интересы. Изучай материалы, вступай в обсуждения и слушай аудио-комнаты 🚀')}
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
            {QUICK_ACTIONS.map(a => (
              <Link
                key={a.label}
                href={a.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  padding: '10px 12px',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  transition: 'background .2s',
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`fa-solid ${a.icon}`} style={{ color: a.color, fontSize: 14 }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12, lineHeight: 1.3 }}>{a.label}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>{a.sub}</div>
                </div>
              </Link>
            ))}
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
              }}
            />
            {isLoggedIn ? t('explore.forYou', 'Для тебя') : t('explore.trending', 'В тренде')}
          </h1>
          <p className="platform-card-desc">
            {isLoggedIn
              ? t('explore.feedDesc', 'Лучшие материалы из твоих комнат и со всей платформы — подобраны алгоритмом.')
              : t('explore.feedDescGuest', 'Лучшие материалы из всех комнат, подобранные по свежести и популярности.')}
          </p>
        </div>
      </div>
    </>
  );
}

export function ExploreEmpty() {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon="fa-compass"
      variant="default"
      title={t('explore.noContent', 'Пока нет материалов')}
      description={t('explore.noContentDesc', 'Подпишитесь на интересные комнаты — контент появится здесь.')}
      primaryAction={{
        label: t('rooms.knowledgeRooms', 'Смотреть комнаты'),
        href: '/rooms',
        icon: 'fa-shapes',
      }}
    />
  );
}
