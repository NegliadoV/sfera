'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

const EMOJI_SETS = [
  ['😀', '😊', '😂', '🥲', '😍', '🤩', '😎', '🥳', '😢', '😭', '😤', '😡', '🤔', '😏', '🙄', '👍', '👎', '👏', '🙌', '❤️', '🔥', '💯', '✨', '🎉'],
  ['😅', '🤣', '😇', '🥰', '😘', '😋', '😜', '🤪', '😐', '😑', '🤨', '😬', '🙃', '🤗', '🤭', '👋', '✌️', '🤝', '🙏', '💪', '💕', '💖', '💥', '⭐'],
  ['🥺', '😤', '😠', '😈', '👿', '💀', '💩', '🤡', '👻', '👽', '🤖', '🙈', '🙉', '🙊', '🐶', '🐱', '🐸', '🦊', '🐻', '🐼', '🦁', '🐯', '🐮', '🐷'],
];

const COLS = 8;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function EmojiPicker({ onPick, children }: { onPick: (emoji: string) => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ bottom: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (open && btnRef.current && typeof document !== 'undefined') {
      const rect = btnRef.current.getBoundingClientRect();
      const dropdownWidth = 320;
      setPos({
        bottom: window.innerHeight - rect.top + 8,
        left: Math.max(0, Math.min(rect.left, window.innerWidth - dropdownWidth)),
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Эмодзи"
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          border: '1px solid var(--border-color)',
          background: open ? 'var(--bg-accent)' : 'transparent',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
        }}
      >
        {children}
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            bottom: pos.bottom,
            left: pos.left,
            padding: 8,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 9999,
            maxHeight: 200,
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            scrollbarWidth: 'thin',
          }}
        >
          {chunk(EMOJI_SETS.flat(), COLS).map((row, rowIndex) => (
            <div key={rowIndex} style={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
              {row.map((emoji, i) => (
                <button
                  key={rowIndex * COLS + i}
                  type="button"
                  onClick={() => {
                    onPick(emoji);
                    setOpen(false);
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    padding: 0,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    borderRadius: 8,
                    fontSize: '1.2rem',
                  }}
                  className="hover:bg-[var(--studio-participant-bg)]"
                >
                  {emoji}
                </button>
              ))}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
