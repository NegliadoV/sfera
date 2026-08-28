'use client';

import { useState, useCallback } from 'react';
import { useDataChannel } from '@livekit/components-react';

export function SphereViewer() {
  const [url, setUrl] = useState('/universes');
  const [inputVal, setInputVal] = useState('/universes');

  // Synchronize navigation
  const onMessage = useCallback((msg: { payload: Uint8Array }) => {
    try {
      const data = JSON.parse(new TextDecoder().decode(msg.payload));
      if (data.type === 'NAV_SPHERE' && data.url) {
        setUrl(data.url);
        setInputVal(data.url);
      }
    } catch (e) {
      console.error('Failed to parse sphere payload', e);
    }
  }, []);

  const { send } = useDataChannel('sphere-sync', onMessage);

  const handleNav = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal) return;
    
    // Auto-format shorthand urls
    let finalUrl = inputVal;
    if (!finalUrl.startsWith('http') && !finalUrl.startsWith('/')) {
      finalUrl = '/' + finalUrl;
    }

    setUrl(finalUrl);
    
    // Broadcast
    const payload = JSON.stringify({ type: 'NAV_SPHERE', url: finalUrl });
    send(new TextEncoder().encode(payload), { reliable: true });
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
      
      {/* Navigation Bar */}
      <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 12 }}>
        <form onSubmit={handleNav} style={{ flex: 1, display: 'flex', gap: 12 }}>
          <input 
            type="text" 
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="Введите ссылку (например /universes/my-sphere) чтобы показать всем..."
            style={{
              flex: 1,
              padding: '8px 16px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              background: 'rgba(0,0,0,0.3)',
              color: 'var(--text-primary)',
              fontSize: '0.95rem'
            }}
          />
          <button type="submit" className="btn-glow" style={{ padding: '0 20px', borderRadius: 'var(--radius-lg)', background: 'var(--accent-primary)', color: '#fff', fontWeight: 600 }}>
            <i className="fas fa-sync-alt" style={{ marginRight: 8 }} />
            Синхронизировать
          </button>
        </form>
      </div>

      {/* Embedded Iframe Viewer */}
      <div style={{ flex: 1, position: 'relative' }}>
        <iframe 
          src={url}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Сфера"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </div>

    </div>
  );
}
