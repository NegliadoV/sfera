'use client';

import { useState } from 'react';

interface DeleteSourceButtonProps {
  universeSlug: string;
  sourceId: string;
  sourceName: string;
  canDelete: boolean;
}

export function DeleteSourceButton({ universeSlug, sourceId, sourceName, canDelete }: DeleteSourceButtonProps) {
  const [pending, setPending] = useState(false);

  if (!canDelete) return null;

  const handleDelete = async () => {
    if (!confirm(`Удалить источник «${sourceName}»?\n\nПосты из этого источника будут удалены. Источник можно будет создать заново.`)) {
      return;
    }
    setPending(true);
    try {
      const res = await fetch(
        `/api/universes/${encodeURIComponent(universeSlug)}/sources/${sourceId}`,
        { method: 'DELETE', credentials: 'include' }
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data?.error ?? 'Ошибка удаления');
        return;
      }

      window.location.href = `/universes/${universeSlug}`;
    } catch {
      alert('Ошибка сети');
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="text-sm px-3 py-1.5 rounded-[var(--radius-md)] transition-colors"
      style={{
        color: 'var(--accent-red)',
        backgroundColor: 'color-mix(in srgb, var(--accent-red) 10%, transparent)',
        border: '1px solid color-mix(in srgb, var(--accent-red) 25%, transparent)',
      }}
      title="Удалить источник"
    >
      {pending ? 'Удаление...' : (
        <>
          <i className="fa-solid fa-trash" style={{ marginRight: 6 }} aria-hidden />
          Удалить источник
        </>
      )}
    </button>
  );
}
