'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  contentId: string;
  slug: string;
  title: string;
  onDeleted?: () => void;
  className?: string;
};

export function DeleteContentButton({ contentId, slug, title, onDeleted, className = '' }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/content/${contentId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error ?? 'Не удалось удалить пост');
        return;
      }
      setConfirming(false);
      onDeleted?.();
      router.push(`/universes/${slug}/content`);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={className}
        title="Удалить пост"
      >
        <i className="fa-solid fa-trash" /> Удалить
      </button>
    );
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span>Удалить «{title}»?</span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="platform-btn platform-btn-sm"
        style={{ background: 'var(--danger)', color: 'white', border: 'none' }}
      >
        {deleting ? '…' : 'Да'}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={deleting}
        className="platform-btn platform-btn-sm"
      >
        Нет
      </button>
    </span>
  );
}
