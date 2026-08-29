'use client';

import Link from 'next/link';
import { useTranslation } from '@/components/i18n/LanguageProvider';
import { HygieneSettingsForm } from './HygieneSettingsForm';
import { ThemeSettingsForm } from './ThemeSettingsForm';
import { PrivacySettingsForm } from './PrivacySettingsForm';
import { BlocksSettingsForm } from './BlocksSettingsForm';
import { UserTagSettingsForm } from './UserTagSettingsForm';
import { SubscriptionsList } from './SubscriptionsList';
import { RevokeSessionsForm } from './RevokeSessionsForm';
import { LanguageSettingsForm } from './LanguageSettingsForm';

export function SettingsPageClient() {
  const { t } = useTranslation();

  return (
    <div className="platform-page">
      <div className="platform-breadcrumb mb-6">
        <Link href="/">
          <i className="fa-solid fa-globe" style={{ marginRight: 4 }} /> Roominate
        </Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>{t('nav.settings', 'Настройки')}</span>
      </div>

      <div className="platform-card mb-8">
        <div className="platform-card-title" style={{ marginBottom: 8 }}>
          <i className="fa-solid fa-gear" aria-hidden />
          {t('settings.title', 'Настройки')}
          <span className="platform-tag" style={{ marginLeft: 'auto' }}>
            {t('common.all', 'Интерфейс')}
          </span>
        </div>
        <p className="platform-card-desc mb-6">
          <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: 6 }} aria-hidden />
          {t('settings.appearance', 'Внешний вид')}, {t('settings.language', 'язык интерфейса')} {t('common.and', 'и')} {t('settings.hygiene', 'цифровая гигиена')}.
        </p>

        {/* Language */}
        <div className="settings-grid mb-6">
          <div className="settings-card" style={{ flex: '1 1 100%' }}>
            <div className="settings-card-title">
              <i className="fa-solid fa-language" aria-hidden />
              <h2>{t('settings.language', 'Язык интерфейса')} / Language</h2>
            </div>
            <div className="settings-card-desc">
              {t('settings.languageDesc', 'Выберите предпочитаемый язык для интерфейса Roominate.')}
            </div>
            <LanguageSettingsForm />
          </div>
        </div>

        {/* Theme */}
        <div className="settings-grid">
          <ThemeSettingsForm />
        </div>

        <div className="settings-grid" style={{ paddingTop: 0 }}>
          {/* User Tag */}
          <div className="settings-card" style={{ flex: '1 1 100%' }}>
            <div className="settings-card-title">
              <i className="fa-regular fa-at" aria-hidden />
              <h2>{t('settings.userTag', 'Личный тег')}</h2>
            </div>
            <div className="settings-card-desc">
              {t('settings.userTagDesc', 'Ваш уникальный тег для поиска в контактах (@username).')}
            </div>
            <UserTagSettingsForm />
          </div>

          {/* Digital Hygiene */}
          <div className="settings-card settings-hygiene-card" style={{ flex: '1 1 100%' }}>
            <div className="settings-card-title">
              <i className="fa-solid fa-sparkles" aria-hidden />
              <h2>{t('settings.hygiene', 'Цифровая гигиена')}</h2>
            </div>
            <div className="settings-card-desc">
              {t('settings.hygieneDesc', 'Режим фокуса, лимит времени, дайджест.')}
            </div>
            <HygieneSettingsForm />
          </div>

          {/* Privacy */}
          <div className="settings-card" style={{ flex: '1 1 100%' }}>
            <div className="settings-card-title">
              <i className="fa-solid fa-shield-halved" aria-hidden />
              <h2>{t('settings.privacy', 'Приватность сообщений')}</h2>
            </div>
            <div className="settings-card-desc">
              {t('settings.privacyDesc', 'Кто может писать вам в личные сообщения.')}
            </div>
            <PrivacySettingsForm />
          </div>

          {/* Blocked */}
          <div className="settings-card" style={{ flex: '1 1 100%' }}>
            <div className="settings-card-title">
              <i className="fa-solid fa-ban" aria-hidden />
              <h2>{t('settings.blockedUsers', 'Заблокированные')}</h2>
            </div>
            <div className="settings-card-desc">
              {t('settings.blockedDesc', 'Пользователи, которых вы заблокировали.')}
            </div>
            <BlocksSettingsForm />
          </div>

          {/* Subscriptions */}
          <div className="settings-card" style={{ flex: '1 1 100%' }}>
            <div className="settings-card-title">
              <i className="fa-regular fa-credit-card" aria-hidden />
              <h2>{t('settings.subscriptions', 'Платные подписки')}</h2>
            </div>
            <div className="settings-card-desc" style={{ marginBottom: 16 }}>
              {t('settings.subscriptionsDesc', 'Управление подписками на приватные сферы.')}
            </div>
            <SubscriptionsList />
          </div>

          {/* Security / Sessions */}
          <div className="settings-card" style={{ flex: '1 1 100%' }}>
            <div className="settings-card-title">
              <i className="fa-solid fa-lock" aria-hidden />
              <h2>{t('settings.sessions', 'Безопасность')}</h2>
            </div>
            <div className="settings-card-desc">
              {t('settings.sessionsDesc', 'Управление активными сессиями на всех ваших устройствах.')}
            </div>
            <RevokeSessionsForm />
          </div>
        </div>

        <div className="settings-footer">
          <div className="settings-save-note">
            <i className="fa-regular fa-circle-check settings-save-icon" aria-hidden />
            <span>{t('settings.savedNote', 'настройки внешнего вида сохраняются в браузере')}</span>
          </div>
          <div className="settings-save-badge">
            <i className="fa-regular fa-floppy-disk" aria-hidden /> {t('common.saved', 'применено')}
          </div>
        </div>
      </div>
    </div>
  );
}
