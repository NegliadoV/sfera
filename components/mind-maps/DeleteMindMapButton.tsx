'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function DeleteMindMapButton({
  mapId,
  mapTitle,
  redirectOnDelete = false,
  className = '',
}: {
  mapId: string;
  mapTitle: string;
  redirectOnDelete?: boolean;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Вы уверены, что хотите удалить карту «${mapTitle}»? Это действие нельзя отменить.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/me/mind-maps/${mapId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete map');
      }

      if (redirectOnDelete) {
        router.push('/me/mind-maps');
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка при удалении карты.');
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      title="Удалить карту"
      className={`transition-all duration-200 opacity-70 hover:opacity-100 disabled:opacity-30 ${className}`}
      style={{
        background: 'rgba(255, 76, 76, 0.1)',
        color: '#ff4c4c',
        border: '1px solid rgba(255, 76, 76, 0.3)',
        borderRadius: '8px',
        padding: '6px 10px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        fontSize: '0.8rem',
      }}
    >
      <i className={`fa-solid ${loading ? 'fa-spinner fa-spin' : 'fa-trash-can'}`} />
      <span>{loading ? 'Удаление…' : 'Удалить'}</span>
    </button>
  );
}
