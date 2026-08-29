'use client';

import { signOut } from 'next-auth/react';
import { useTranslation } from '@/components/i18n/LanguageProvider';

export function LogoutButton() {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/' })}
      className="cabinet-action-btn"
      title={t('nav.logout', 'Выйти из аккаунта')}
    >
      <i className="fas fa-sign-out-alt" aria-hidden />
      {t('nav.logout', 'Выйти')}
    </button>
  );
}
