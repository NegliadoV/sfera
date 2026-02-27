'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

export function DeleteUniverseButton({
  slug,
  universeName,
}: {
  slug: string;
  universeName: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/universes/${encodeURIComponent(slug)}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error ?? 'Не удалось удалить сферу');
        setDeleting(false);
        return;
      }
      // Если удаление происходит из личного кабинета, остаемся на странице /me
      // Иначе перенаправляем на каталог сфер
      if (pathname === '/me') {
        router.refresh();
      } else {
        router.push('/universes');
        router.refresh();
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка при удалении');
      setDeleting(false);
    }
  }

  function handleCancel() {
    setConfirming(false);
  }

  return (
    <div className="delete-universe-button-container">
      {!confirming ? (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="delete-universe-button delete-universe-button--close"
          title={`Удалить сферу «${universeName}»`}
        >
          <i className="fa-solid fa-xmark" aria-hidden />
        </button>
      ) : (
        <div className="delete-universe-confirm">
          <span className="delete-universe-confirm-text">Точно удалить?</span>
          <div className="delete-universe-confirm-buttons">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="delete-universe-confirm-btn delete-universe-confirm-btn--danger"
            >
              {deleting ? '…' : 'Да'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={deleting}
              className="delete-universe-confirm-btn"
            >
              Нет
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
