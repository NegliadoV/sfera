'use client';

import { useState } from 'react';
import { useTranslation } from '@/components/i18n/LanguageProvider';

export function PersonalSphereViewer({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [url, setUrl] = useState('/universes');
  const [inputVal, setInputVal] = useState('/universes');

  const handleNav = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal) return;
    
    let finalUrl = inputVal;
    if (!finalUrl.startsWith('http') && !finalUrl.startsWith('/')) {
      finalUrl = '/' + finalUrl;
    }
    setUrl(finalUrl);
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(20,20,30,0.8)', backdropFilter: 'blur(30px)' }}>
      {/* Navigation Bar */}
      <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 12, alignItems: 'center' }}>
        <form onSubmit={handleNav} style={{ flex: 1, display: 'flex', gap: 8 }}>
          <input 
            type="text" 
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder={t('mindMaps.roomPlaceholder', 'Комната (/universes/xxx)')}
            style={{
              flex: 1,
              padding: '6px 12px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              background: 'rgba(0,0,0,0.3)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem'
            }}
          />
          <button type="submit" className="btn-glow flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 'var(--radius-lg)', background: 'var(--accent-primary)', color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>
            <i className="fas fa-search" />
          </button>
        </form>
        <button onClick={onClose} className="hover:bg-white/20 transition-colors" style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fas fa-times" />
        </button>
      </div>

      {/* Embedded Iframe Viewer */}
      <div style={{ flex: 1, position: 'relative' }}>
        <iframe 
          src={url}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title={t('mindMaps.room', 'Комната')}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </div>
    </div>
  );
}
