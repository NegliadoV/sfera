'use client';

import { useState } from 'react';

interface AggregateSourceButtonProps {
  universeSlug: string;
  sourceId: string;
  canEdit: boolean;
}

export function AggregateSourceButton({ universeSlug, sourceId, canEdit }: AggregateSourceButtonProps) {
  const [pending, setPending] = useState(false);

  if (!canEdit) return null;

  const runAggregation = async (clearFirst = false) => {
    setPending(true);
    try {
      const res = await fetch(
        `/api/universes/${encodeURIComponent(universeSlug)}/sources/${sourceId}/aggregate`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clearFirst }),
        }
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data?.error ?? 'Ошибка запуска агрегации');
        return;
      }

      const processed = data.processed ?? 0;
      alert(
        processed > 0
          ? `Агрегация завершена. Добавлено ${processed} новых постов.`
          : clearFirst
            ? 'Посты очищены и пересобраны. Новых постов нет.'
            : 'Агрегация завершена. Новых постов нет.'
      );
      window.location.reload();
    } catch {
      alert('Ошибка сети');
    } finally {
      setPending(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={() => runAggregation(false)}
        disabled={pending}
        className="add-content-form-submit"
      >
        {pending ? 'Агрегация...' : (
          <>
            <i className="fa-solid fa-sync" style={{ marginRight: 6 }} aria-hidden />
            Запустить агрегацию
          </>
        )}
      </button>
      <button
        type="button"
        onClick={() => runAggregation(true)}
        disabled={pending}
        className="add-content-form-submit"
        title="Удалить посты источника и загрузить заново"
        style={{ opacity: 0.9 }}
      >
        {pending ? '...' : (
          <>
            <i className="fa-solid fa-eraser" style={{ marginRight: 6 }} aria-hidden />
            Очистить и пересобрать
          </>
        )}
      </button>
    </div>
  );
}
