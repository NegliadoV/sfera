'use client';

import { signOut } from 'next-auth/react';

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/' })}
      className="cabinet-action-btn"
      title="Выйти из аккаунта"
    >
      <i className="fas fa-sign-out-alt" aria-hidden />
      Выйти
    </button>
  );
}
