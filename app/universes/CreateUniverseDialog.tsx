'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/components/i18n/LanguageProvider';
import { CreateUniverseForm } from './CreateUniverseForm';

export function CreateUniverseDialog({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const overlay = open && (
    <div
      className="universes-create-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t('rooms.createTitle', 'Создать комнату')}
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div className="universes-create-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="universes-create-close"
          aria-label={t('common.close', 'Закрыть')}
        >
          <i className="fas fa-times" aria-hidden />
        </button>
        <div className="universes-create-modal-body">
          <CreateUniverseForm />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={compact ? 'sidebar-create-sphere-btn' : 'platform-btn platform-btn-primary'}
        style={compact ? undefined : { marginBottom: 24 }}
      >
        <i className="fa-solid fa-plus" aria-hidden />
        {t('rooms.create', 'Создать комнату')}
      </button>

      {mounted && typeof document !== 'undefined' && overlay && createPortal(overlay, document.body)}
    </>
  );
}
