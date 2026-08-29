'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/i18n/LanguageProvider';

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
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(t('mindMaps.deleteConfirm', `Вы уверены, что хотите удалить карту «${mapTitle}»? Это действие нельзя отменить.`))) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/me/mind-maps/${mapId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        let errMsg = `HTTP ${res.status}`;
        try {
          const body = await res.json();
          errMsg = body?.error ?? errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      if (redirectOnDelete) {
        router.push('/me/mind-maps');
      } else {
        router.refresh();
      }
    } catch (err: any) {
      console.error('[DeleteMindMap]', err);
      alert(`${t('mindMaps.deleteError', 'Ошибка при удалении карты.')}\n${err?.message ?? ''}`);
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      title={t('mindMaps.deleteMap', 'Удалить карту')}
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
      <span>{loading ? t('common.loading', 'Удаление…') : t('common.delete', 'Удалить')}</span>
    </button>
  );
}
