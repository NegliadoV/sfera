'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type SearchUser = { id: string; name: string | null; image: string | null; userTag?: string | null };

export function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selected, setSelected] = useState<SearchUser[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const search = useCallback(() => {
    const q = query.trim().replace(/^@+/, '');
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    fetch(`/api/me/contacts/search?query=${encodeURIComponent(q)}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((arr) => {
        const selectedIds = new Set(selected.map((u) => u.id));
        setSearchResults(Array.isArray(arr) ? arr.filter((u: SearchUser) => !selectedIds.has(u.id)) : []);
      })
      .catch(() => setSearchResults([]));
  }, [query, selected]);

  useEffect(() => {
    const t = setTimeout(search, 300);
    return () => clearTimeout(t);
  }, [query, search]);

  function toggleUser(u: SearchUser) {
    setSelected((prev) => {
      if (prev.some((x) => x.id === u.id)) return prev.filter((x) => x.id !== u.id);
      return [...prev, u];
    });
    setSearchResults((prev) => prev.filter((x) => x.id !== u.id));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 128) {
      setError('Название 1–128 символов');
      return;
    }
    if (selected.length === 0) {
      setError('Добавьте хотя бы одного участника');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/me/group-chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: trimmed, participantIds: selected.map((u) => u.id) }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        onClose();
        router.push(`/messages/group/${data.id}`);
        window.dispatchEvent(new CustomEvent('messages-badge-refresh'));
      } else {
        setError(data.error ?? 'Ошибка создания группы');
      }
    } catch {
      setError('Ошибка сети');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[350] bg-black/50 flex items-center justify-center p-0 md:p-6 overflow-hidden"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="platform-card w-full h-full max-h-[100dvh] md:w-auto md:h-auto md:max-h-[90dvh] md:max-w-[420px] !rounded-none md:!rounded-2xl overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          paddingTop: 'max(20px, env(safe-area-inset-top))',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          paddingLeft: 'max(20px, env(safe-area-inset-left))',
          paddingRight: 'max(20px, env(safe-area-inset-right))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Создать групповой чат</h3>
          <button
            type="button"
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--bg-accent)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 18 }}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem', fontWeight: 500 }}>Название группы</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            placeholder="Например: Команда проекта"
            maxLength={128}
            className="chat-input-glass-field"
            style={{ marginBottom: 16, borderRadius: 12, padding: '12px 14px' }}
          />

          <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem', fontWeight: 500 }}>Участники (поиск по тегу или имени)</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="@тег или имя"
            className="chat-input-glass-field"
            style={{ marginBottom: 12, borderRadius: 12, padding: '12px 14px' }}
          />

          {searchResults.length > 0 && (
            <div style={{ marginBottom: 12, maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleUser(u)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'inherit',
                    textAlign: 'left',
                    fontSize: '0.95rem',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                  className="hover:bg-[var(--studio-participant-bg)]"
                >
                  {u.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={u.image} alt="" width={36} height={36} style={{ borderRadius: 10, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                      {(u.name ?? u.id).slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span>{u.name ?? `@${u.userTag ?? u.id.slice(0, 8)}`}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--accent-primary)', fontSize: '0.85rem' }}>+ Добавить</span>
                </button>
              ))}
            </div>
          )}

          {selected.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Выбрано: {selected.length}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {selected.map((u) => (
                  <span
                    key={u.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 10px',
                      background: 'var(--accent-primary)',
                      color: 'white',
                      borderRadius: 8,
                      fontSize: '0.9rem',
                    }}
                  >
                    {u.name ?? `@${u.userTag ?? u.id.slice(0, 8)}`}
                    <button
                      type="button"
                      onClick={() => setSelected((prev) => prev.filter((x) => x.id !== u.id))}
                      style={{ width: 20, height: 20, borderRadius: 10, border: 'none', background: 'rgba(0,0,0,0.2)', color: 'white', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 'auto', paddingTop: 24 }}>
            {error && <p style={{ color: 'var(--accent-red, #e53e3e)', fontSize: '0.9rem', marginBottom: 12, textAlign: 'center' }}>{error}</p>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>
                Отмена
              </button>
              <button type="submit" disabled={creating} className="platform-btn" style={{ flex: 1, padding: '14px', borderRadius: 12 }}>
                {creating ? 'Создание…' : 'Создать'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
