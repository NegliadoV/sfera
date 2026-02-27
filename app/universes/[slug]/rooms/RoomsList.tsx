'use client';

import Link from 'next/link';
import { useState } from 'react';

type ThemeItem = { id: string; name: string };

type RoomItem = {
  id: string;
  title: string;
  status: string;
  themeId?: string;
  themeName?: string;
  timeLimitMinutes?: number;
  createdById: string;
  currentRoundIndex: number;
  createdAt: string;
  creatorName?: string;
};

export function RoomsList({
  slug,
  themes: initialThemes,
  initialRooms,
  defaultContentId,
  defaultTitle,
}: {
  slug: string;
  universeName?: string;
  themes: ThemeItem[];
  initialRooms: RoomItem[];
  defaultContentId?: string;
  defaultTitle?: string;
}) {
  const [rooms, setRooms] = useState<RoomItem[]>(initialRooms);
  const [themes, setThemes] = useState<ThemeItem[]>(initialThemes);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState(defaultTitle ?? '');
  const [themeId, setThemeId] = useState<string>('');
  const [newThemeName, setNewThemeName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setError(null);
    try {
      let finalThemeId: string | null = themeId && themeId !== '__none__' ? themeId : null;
      let createdThemeName: string | undefined;
      if (newThemeName.trim()) {
        const themeRes = await fetch(`/api/universes/${slug}/themes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name: newThemeName.trim() }),
        });
        if (themeRes.ok) {
          const theme = await themeRes.json();
          finalThemeId = theme.id;
          createdThemeName = theme.name;
          setThemes((prev) => [...prev, { id: theme.id, name: theme.name }]);
          setNewThemeName('');
        }
      }
      const body: { title: string; themeId?: string | null; contentId?: string } = {
        title: title.trim(),
        themeId: finalThemeId,
      };
      if (defaultContentId) body.contentId = defaultContentId;
      const res = await fetch(`/api/universes/${slug}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Ошибка ${res.status}`);
      }
      const room = await res.json();
      const themeName = createdThemeName ?? (finalThemeId ? themes.find((t) => t.id === finalThemeId)?.name : undefined);
      setRooms((prev) => [
        {
          id: room.id,
          title: room.title,
          status: room.status,
          themeId: finalThemeId ?? undefined,
          themeName,
          timeLimitMinutes: room.timeLimitMinutes ?? undefined,
          createdById: room.createdById,
          currentRoundIndex: room.currentRoundIndex ?? 0,
          createdAt: room.createdAt ?? new Date().toISOString(),
          creatorName: undefined,
        },
        ...prev,
      ]);
      setTitle('');
      setThemeId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать комнату');
    } finally {
      setCreating(false);
    }
  }

  const statusLabel: Record<string, string> = {
    waiting: 'Ожидание',
    ongoing: 'Идёт',
    finished: 'Завершена',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <form onSubmit={handleCreate} className="form-row-mobile" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 220px', minWidth: '200px' }}>
          <i className="fas fa-video" style={{ position: 'absolute', left: '14px', color: '#7e8087', fontSize: '0.8rem' }}></i>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название комнаты"
            disabled={creating}
            style={{
              backgroundColor: '#2b2d30',
              border: '1px solid #3d4045',
              borderRadius: '14px',
              padding: '12px 16px 12px 40px',
              width: '100%',
              color: '#f2f3f5',
              fontSize: '0.95rem',
              transition: 'border 0.1s, background 0.1s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#2563eb';
              e.currentTarget.style.backgroundColor = '#2f3136';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#3d4045';
              e.currentTarget.style.backgroundColor = '#2b2d30';
            }}
          />
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 180px' }}>
          <i className="fas fa-tag" style={{ position: 'absolute', left: '14px', color: '#7e8087', fontSize: '0.8rem', zIndex: 1 }}></i>
          <select
            value={themeId}
            onChange={(e) => setThemeId(e.target.value)}
            disabled={creating}
            style={{
              backgroundColor: '#2b2d30',
              border: '1px solid #3d4045',
              borderRadius: '14px',
              padding: '12px 16px 12px 40px',
              width: '100%',
              color: '#f2f3f5',
              fontSize: '0.95rem',
              transition: 'border 0.1s, background 0.1s',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239b9da2' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              paddingRight: '40px',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#2563eb';
              e.currentTarget.style.backgroundColor = '#2f3136';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#3d4045';
              e.currentTarget.style.backgroundColor = '#2b2d30';
            }}
          >
            <option value="__none__" style={{ backgroundColor: '#2b2d30', color: '#f2f3f5' }}>Без темы</option>
            {themes.map((t) => (
              <option key={t.id} value={t.id} style={{ backgroundColor: '#2b2d30', color: '#f2f3f5' }}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 220px' }}>
          <i className="fas fa-plus-circle" style={{ position: 'absolute', left: '14px', color: '#7e8087', fontSize: '0.8rem' }}></i>
          <input
            type="text"
            value={newThemeName}
            onChange={(e) => setNewThemeName(e.target.value)}
            placeholder="Или новая тема (создать и привязать)"
            disabled={creating}
            style={{
              backgroundColor: '#2b2d30',
              border: '1px solid #3d4045',
              borderRadius: '14px',
              padding: '12px 16px 12px 40px',
              width: '100%',
              color: '#f2f3f5',
              fontSize: '0.95rem',
              transition: 'border 0.1s, background 0.1s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#2563eb';
              e.currentTarget.style.backgroundColor = '#2f3136';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#3d4045';
              e.currentTarget.style.backgroundColor = '#2b2d30';
            }}
          />
        </div>
        <button
          type="submit"
          disabled={creating || !title.trim()}
          className="btn-primary"
        >
          <i className={`fas ${creating ? 'fa-spinner fa-pulse' : 'fa-plus-circle'}`} style={{ fontSize: '0.9rem' }}></i>
          {creating ? 'Создание...' : 'Создать комнату'}
        </button>
      </form>
      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '14px',
            fontSize: '0.9rem',
            color: '#f23f42',
            backgroundColor: 'rgba(242, 63, 66, 0.1)',
            border: '1px solid rgba(242, 63, 66, 0.2)',
          }}
        >
          {error}
        </div>
      )}
      {rooms.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 16px',
            background: '#1f2124',
            borderRadius: '16px',
            border: '1px dashed #4e5158',
          }}
        >
          <i className="fas fa-video" style={{ fontSize: '2.5rem', color: '#6f727a', marginBottom: '12px' }}></i>
          <p style={{ color: '#a1a4ab', fontSize: '0.9rem', textAlign: 'center' }}>
            Пока нет комнат. Создайте первую с помощью формы выше.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {rooms.map((r) => (
            <Link
              key={r.id}
              href={`/universes/${slug}/rooms/${r.id}`}
              className="room-card-link"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', flex: 1 }}>
                <div
                  style={{
                    background: '#35373c',
                    borderRadius: '16px',
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#b9bbbe',
                    fontSize: '1.4rem',
                  }}
                >
                  <i className="fas fa-video"></i>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', margin: 0 }}>{r.title}</h3>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        background: r.status === 'ongoing' ? '#22c55e' : r.status === 'finished' ? '#6f727a' : '#2563eb',
                        padding: '2px 10px',
                        borderRadius: '30px',
                        color: 'white',
                      }}
                    >
                      {statusLabel[r.status] ?? r.status}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: '#a5a8af',
                      marginTop: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexWrap: 'wrap',
                    }}
                  >
                    {r.themeName && (
                      <>
                        <i className="fas fa-tag" style={{ color: '#6d7078', fontSize: '0.6rem' }}></i>
                        {r.themeName}
                        <span style={{ margin: '0 4px' }}>·</span>
                      </>
                    )}
                    <span>{r.creatorName ?? 'Автор'}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
