'use client';

import Link from 'next/link';
import { useState } from 'react';

type MapItem = {
  id: string;
  title: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  creatorName?: string;
  nodeCount?: number;
};

export function MindMapsList({
  slug,
  initialMaps,
  addContentId,
  addContentTitle,
}: {
  slug: string;
  initialMaps: MapItem[];
  addContentId?: string;
  addContentTitle?: string;
}) {
  const [maps, setMaps] = useState<MapItem[]>(initialMaps);
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addToMapId, setAddToMapId] = useState('');
  const [addingToMap, setAddingToMap] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/universes/${slug}/mind-maps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Ошибка ${res.status}`);
      }
      const map = await res.json();
      setMaps((prev) => [
        {
          id: map.id,
          title: map.title,
          createdById: map.createdById,
          createdAt: map.createdAt ?? new Date().toISOString(),
          updatedAt: map.updatedAt ?? new Date().toISOString(),
          creatorName: undefined,
        },
        ...prev,
      ]);
      setTitle('');
      setShowCreateForm(false);
      window.location.href = `/universes/${slug}/mind-maps/${map.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать карту');
    } finally {
      setCreating(false);
    }
  }

  async function addContentToMap(e: React.FormEvent) {
    e.preventDefault();
    if (!addToMapId || !addContentId || !addContentTitle) return;
    setAddingToMap(true);
    setError(null);
    try {
      const res = await fetch(`/api/universes/${slug}/mind-maps/${addToMapId}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          label: addContentTitle,
          type: 'source',
          contentId: addContentId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Ошибка ${res.status}`);
      }
      window.location.href = `/universes/${slug}/mind-maps/${addToMapId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setAddingToMap(false);
    }
  }

  return (
    <div className="space-y-6">
      {addContentId && addContentTitle && maps.length > 0 && (
        <div
          className="p-4 rounded-[var(--radius-md)] border"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-accent)' }}
        >
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Добавить «{addContentTitle.slice(0, 50)}{addContentTitle.length > 50 ? '…' : ''}» в карту:
          </p>
          <form onSubmit={addContentToMap} className="flex flex-wrap gap-2 items-center">
            <select
              value={addToMapId}
              onChange={(e) => setAddToMapId(e.target.value)}
              className="px-3 py-2 rounded-[var(--radius-md)] border text-sm min-w-[200px]"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">Выберите карту</option>
              {maps.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={addingToMap || !addToMapId}
              className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent-green)', color: 'white' }}
            >
              {addingToMap ? '…' : 'Добавить'}
            </button>
          </form>
        </div>
      )}

      <div style={{ marginTop: '16px' }}>
        {!showCreateForm ? (
          <button
            type="button"
            className="neon-block"
            onClick={() => setShowCreateForm(true)}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '8px 16px',
              borderRadius: '30px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--hover-color)';
              e.currentTarget.style.borderColor = 'var(--neon-border)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <i className="fas fa-plus"></i> Создать ментальную карту
          </button>
        ) : (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название карты"
              autoFocus
              style={{
                backgroundColor: '#2b2d30',
                border: '1px solid #3d4045',
                borderRadius: '14px',
                padding: '12px 16px',
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
              disabled={creating}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="submit"
                disabled={creating || !title.trim()}
                className="btn-primary"
                style={{
                  flex: 1,
                  opacity: creating || !title.trim() ? 0.5 : 1,
                  cursor: creating || !title.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                <i className={`fas ${creating ? 'fa-spinner fa-pulse' : 'fa-plus'}`}></i>
                {creating ? 'Создание…' : 'Создать'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setTitle('');
                }}
                className="btn-secondary"
                disabled={creating}
              >
                Отмена
              </button>
            </div>
          </form>
        )}
      </div>
      {error && (
        <p className="text-sm" style={{ color: 'var(--accent-red)' }}>
          {error}
        </p>
      )}
      {maps.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: '#a5a8af' }}>
          <i className="fas fa-diagram-project" style={{ fontSize: '2.5rem', color: '#6f727a', marginBottom: '12px' }}></i>
          <p style={{ fontSize: '0.9rem', textAlign: 'center' }}>Пока нет карт. Создайте первую с помощью формы выше.</p>
        </div>
      ) : (
        <div className="mind-map-list">
          {maps.map((m) => {
            // Выбираем иконку в зависимости от названия или используем дефолтную
            const getIcon = (title: string) => {
              const lower = title.toLowerCase();
              if (lower.includes('теори') || lower.includes('theory')) return 'fa-sitemap';
              if (lower.includes('разум') || lower.includes('mind') || lower.includes('тело') || lower.includes('body')) return 'fa-brain';
              if (lower.includes('ии') || lower.includes('ai') || lower.includes('феномен') || lower.includes('phenomen')) return 'fa-robot';
              return 'fa-project-diagram';
            };
            return (
              <Link
                key={m.id}
                href={`/universes/${slug}/mind-maps/${m.id}`}
                className="mind-map-item"
              >
                <i className={`fas ${getIcon(m.title)}`}></i>
                <span>{m.title}</span>
                {m.nodeCount !== undefined && (
                  <span style={{ color: '#8a8e96', fontSize: '0.7rem' }}>
                    {m.nodeCount} {m.nodeCount === 1 ? 'узел' : m.nodeCount < 5 ? 'узла' : 'узлов'}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
