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
      className="create-group-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 350,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(24px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left))',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="platform-card"
        style={{
          maxWidth: 420,
          width: '100%',
          maxHeight: 'min(90vh, 90dvh)',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
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

        <form onSubmit={handleCreate}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem', fontWeight: 500 }}>Название группы</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            placeholder="Например: Команда проекта"
            maxLength={128}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', marginBottom: 16, fontSize: '0.95rem' }}
          />

          <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem', fontWeight: 500 }}>Участники (поиск по тегу или имени)</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="@тег или имя"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', marginBottom: 12, fontSize: '0.95rem' }}
          />

          {searchResults.length > 0 && (
            <div style={{ marginBottom: 12, maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
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
                      background: 'var(--bg-accent)',
                      borderRadius: 8,
                      fontSize: '0.9rem',
                    }}
                  >
                    {u.name ?? `@${u.userTag ?? u.id.slice(0, 8)}`}
                    <button
                      type="button"
                      onClick={() => setSelected((prev) => prev.filter((x) => x.id !== u.id))}
                      style={{ width: 20, height: 20, borderRadius: 10, border: 'none', background: 'var(--text-muted)', color: 'white', cursor: 'pointer', fontSize: 12 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && <p style={{ color: 'var(--accent-red, #e53e3e)', fontSize: '0.9rem', marginBottom: 12 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer' }}>
              Отмена
            </button>
            <button type="submit" disabled={creating} className="platform-btn platform-btn-sm">
              {creating ? 'Создание…' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
