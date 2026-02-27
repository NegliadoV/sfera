'use client';

import { useState } from 'react';
import Link from 'next/link';

type NodeType = { id: string; type: string; label: string; contentId: string | null; commentId: string | null };
type EdgeType = { id: string; fromNodeId: string; toNodeId: string };

type MapData = {
  id: string;
  title: string;
  nodes: NodeType[];
  edges: EdgeType[];
};

const NODE_TYPE_LABEL: Record<string, string> = {
  source: 'Источник',
  thesis: 'Тезис',
  discussion: 'Дискуссия',
};

export function MindMapEditor({
  slug,
  mapId,
  initialMap,
  canEdit,
}: {
  slug: string;
  mapId: string;
  initialMap: MapData;
  canEdit: boolean;
}) {
  const [nodes, setNodes] = useState(initialMap.nodes);
  const [edges, setEdges] = useState(initialMap.edges);
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeType, setNodeType] = useState<'source' | 'thesis' | 'discussion'>('thesis');
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [pending, setPending] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function addNode(e: React.FormEvent) {
    e.preventDefault();
    if (!nodeLabel.trim()) return;
    setPending('node');
    setError(null);
    try {
      const res = await fetch(`/api/universes/${slug}/mind-maps/${mapId}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ label: nodeLabel.trim(), type: nodeType }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Ошибка ${res.status}`);
      }
      const node = await res.json();
      setNodes((prev) => [...prev, { ...node, position: null }]);
      setNodeLabel('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setPending('');
    }
  }

  async function addEdge(e: React.FormEvent) {
    e.preventDefault();
    if (!fromId || !toId || fromId === toId) return;
    setPending('edge');
    setError(null);
    try {
      const res = await fetch(`/api/universes/${slug}/mind-maps/${mapId}/edges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fromNodeId: fromId, toNodeId: toId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Ошибка ${res.status}`);
      }
      const edge = await res.json();
      setEdges((prev) => [...prev, edge]);
      setFromId('');
      setToId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setPending('');
    }
  }

  const getNodeLabel = (id: string) => nodes.find((n) => n.id === id)?.label ?? id.slice(0, 8);

  return (
    <div className="space-y-8">
      {error && (
        <p className="text-sm" style={{ color: 'var(--accent-red)' }}>
          {error}
        </p>
      )}

      <section>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Узлы ({nodes.length})
        </h3>
        <ul className="list-none p-0 m-0 flex flex-wrap gap-2">
          {nodes.map((n) => (
            <li
              key={n.id}
              className="px-3 py-1.5 rounded-[var(--radius-md)] text-sm border"
              style={{
                backgroundColor: 'var(--bg-accent)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              <span className="text-xs opacity-80">{NODE_TYPE_LABEL[n.type] ?? n.type}:</span>{' '}
              {n.label}
              {n.contentId && (
                <Link
                  href={`/universes/${slug}/content/${n.contentId}`}
                  className="ml-2 text-xs underline"
                  style={{ color: 'var(--accent-blue)' }}
                >
                  контент
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Связи ({edges.length})
        </h3>
        <ul className="list-none p-0 m-0 space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {edges.map((e) => (
            <li key={e.id}>
              {getNodeLabel(e.fromNodeId)} → {getNodeLabel(e.toNodeId)}
            </li>
          ))}
        </ul>
      </section>

      {canEdit && (
        <>
          <section className="pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Добавить узел
            </h3>
            <form onSubmit={addNode} className="flex flex-wrap gap-2 items-center">
              <input
                type="text"
                value={nodeLabel}
                onChange={(e) => setNodeLabel(e.target.value)}
                placeholder="Подпись узла"
                className="px-3 py-2 rounded-[var(--radius-md)] border text-sm min-w-[180px]"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
                disabled={pending !== ''}
              />
              <select
                value={nodeType}
                onChange={(e) => setNodeType(e.target.value as 'source' | 'thesis' | 'discussion')}
                className="px-3 py-2 rounded-[var(--radius-md)] border text-sm"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="thesis">Тезис</option>
                <option value="source">Источник</option>
                <option value="discussion">Дискуссия</option>
              </select>
              <button
                type="submit"
                disabled={pending !== '' || !nodeLabel.trim()}
                className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}
              >
                {pending === 'node' ? '…' : 'Добавить'}
              </button>
            </form>
          </section>

          <section>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Добавить связь
            </h3>
            <form onSubmit={addEdge} className="flex flex-wrap gap-2 items-center">
              <select
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className="px-3 py-2 rounded-[var(--radius-md)] border text-sm min-w-[160px]"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="">От узла</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label.slice(0, 40)}
                  </option>
                ))}
              </select>
              <span style={{ color: 'var(--text-secondary)' }}>→</span>
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                className="px-3 py-2 rounded-[var(--radius-md)] border text-sm min-w-[160px]"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="">К узлу</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label.slice(0, 40)}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={pending !== '' || !fromId || !toId || fromId === toId}
                className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent-green)', color: 'white' }}
              >
                {pending === 'edge' ? '…' : 'Связать'}
              </button>
            </form>
          </section>
        </>
      )}

      {!canEdit && (
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Редактировать карту может только создатель.
        </p>
      )}
    </div>
  );
}
