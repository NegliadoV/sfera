import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { HygieneSettingsForm } from './HygieneSettingsForm';
import { ThemeSettingsForm } from './ThemeSettingsForm';
import { PrivacySettingsForm } from './PrivacySettingsForm';
import { BlocksSettingsForm } from './BlocksSettingsForm';
import { UserTagSettingsForm } from './UserTagSettingsForm';
import { SubscriptionsList } from './SubscriptionsList';
import { RevokeSessionsForm } from './RevokeSessionsForm';


export const metadata = {
  title: 'Настройки | Roominate',
  description: 'Внешний вид и цифровая гигиена.',
};

export const dynamic = 'force-dynamic';

export default async function SettingsPage(
  props: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
  }
) {
  const searchParams = await props.searchParams;
  if (searchParams) await searchParams;
  const session = await auth();
  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent('/settings')}`);
  }
  return (
    <div className="platform-page">
      <div className="platform-breadcrumb mb-6">
        <Link href="/">
          <i className="fa-solid fa-globe" style={{ marginRight: 4 }} /> Roominate
        </Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>Настройки</span>
      </div>

      <div className="platform-card mb-8">
        <div className="platform-card-title" style={{ marginBottom: 8 }}>
          <i className="fa-solid fa-gear" aria-hidden />
          Настройки
          <span className="platform-tag" style={{ marginLeft: 'auto' }}>Внешний вид</span>
        </div>
        <p className="platform-card-desc mb-6">
          <i className="fa-regular fa-palette" style={{ marginRight: 6 }} aria-hidden />
          Внешний вид и цифровая гигиена. Настройки сохраняются в браузере.
        </p>

        <div className="settings-grid">
          <ThemeSettingsForm />
        </div>

        <div className="settings-grid" style={{ paddingTop: 0 }}>
          <div className="settings-card" style={{ flex: '1 1 100%' }}>
            <div className="settings-card-title">
              <i className="fa-regular fa-at" aria-hidden />
              <h2>Личный тег</h2>
            </div>
            <div className="settings-card-desc">
              Ваш тег для поиска в контактах, например @bublik33.
            </div>
            <UserTagSettingsForm />
          </div>
          <div className="settings-card settings-hygiene-card" style={{ flex: '1 1 100%' }}>
            <div className="settings-card-title">
              <i className="fa-solid fa-sparkles" aria-hidden />
              <h2>Цифровая гигиена</h2>
            </div>
            <div className="settings-card-desc">
              Режим фокуса, лимит времени, дайджест.
            </div>
            <HygieneSettingsForm />
          </div>
          <div className="settings-card" style={{ flex: '1 1 100%' }}>
            <div className="settings-card-title">
              <i className="fa-regular fa-shield-halved" aria-hidden />
              <h2>Приватность сообщений</h2>
            </div>
            <div className="settings-card-desc">
              Кто может писать вам в личные сообщения.
            </div>
            <PrivacySettingsForm />
          </div>
          <div className="settings-card" style={{ flex: '1 1 100%' }}>
            <div className="settings-card-title">
              <i className="fa-solid fa-ban" aria-hidden />
              <h2>Заблокированные</h2>
            </div>
            <div className="settings-card-desc">
              Пользователи, которых вы заблокировали.
            </div>
            <BlocksSettingsForm />
          </div>
          <div className="settings-card" style={{ flex: '1 1 100%' }}>
            <div className="settings-card-title">
              <i className="fa-regular fa-credit-card" aria-hidden />
              <h2>Платные подписки</h2>
            </div>
            <div className="settings-card-desc" style={{ marginBottom: 16 }}>
              Управление подписками на приватные сферы (через ЮKassa).
            </div>
            <SubscriptionsList />
          </div>
          <div className="settings-card" style={{ flex: '1 1 100%' }}>
            <div className="settings-card-title">
              <i className="fa-solid fa-lock" aria-hidden />
              <h2>Безопасность</h2>
            </div>
            <div className="settings-card-desc">
              Управление активными сессиями на всех ваших устройствах.
            </div>
            <RevokeSessionsForm />
          </div>
        </div>

        <div className="settings-footer">
          <div className="settings-save-note">
            <i className="fa-regular fa-circle-check settings-save-icon" aria-hidden />
            <span>настройки внешнего вида сохраняются в браузере</span>
          </div>
          <div className="settings-save-badge">
            <i className="fa-regular fa-floppy-disk" aria-hidden /> применено
          </div>
        </div>
      </div>
    </div>
  );
}
