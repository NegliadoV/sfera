'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function MiniAppModal({ 
  url, 
  title, 
  onClose 
}: { 
  url: string; 
  title: string; 
  onClose: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // PostMessage API base
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = e.data;
        if (data.type === 'Roominate_MINI_APP_CLOSE') {
          onClose();
        }
        if (data.type === 'Roominate_MINI_APP_READY') {
          iframeRef.current?.contentWindow?.postMessage({
            type: 'Roominate_THEME_INFO',
            payload: { theme: document.documentElement.getAttribute('data-theme') || 'dark' }
          }, '*');
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full sm:max-w-md h-[85vh] sm:h-[80vh] bg-[var(--studio-panel-bg)] sm:rounded-2xl rounded-t-2xl shadow-2xl border border-[var(--studio-panel-border)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300 relative">
        
        {/* Fake iOS home indicator for mobile feel */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full sm:hidden"></div>

        <div className="flex items-center justify-between p-4 pt-6 sm:pt-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50 backdrop-blur-md">
          <div className="flex gap-3 items-center">
            <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
              <i className="fas fa-times text-xl"></i>
            </button>
            <span className="font-bold text-[var(--text-primary)] drop-shadow-sm">{title}</span>
          </div>
          <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
            <i className="fas fa-ellipsis-v"></i>
          </button>
        </div>

        <div className="flex-1 w-full bg-[#f4f4f5] dark:bg-[#18181b]">
          <iframe 
            ref={iframeRef}
            src={url}
            className="w-full h-full border-none"
            allow="camera; microphone; fullscreen; clipboard-read; clipboard-write"
          />
        </div>

      </div>
    </div>,
    document.body
  );
}
