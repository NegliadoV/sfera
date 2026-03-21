'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge as xyAddEdge,
  NodeChange,
  EdgeChange,
  Connection,
  Edge,
  Node as FlowNode,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

type NodeType = { id: string; type: string; label: string; contentId: string | null; commentId: string | null; position: any };
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

// --- Кастомный узел "Улика" ---
function EvidenceNode({ data }: { data: any }) {
  return (
    <div 
      className="relative p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/10 w-48 transform transition-transform"
      style={{ 
        backgroundColor: '#e6dfd1', // Цвет старой бумаги
        color: '#1a1a1a', 
        fontFamily: 'var(--font-mono)',
        transform: `rotate(${data.rotation || 0}deg)`,
      }}
    >
      {/* Пин (булавка) */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full shadow-lg border border-red-900 z-10" style={{ background: 'radial-gradient(circle at 30% 30%, #ef4444, #991b1b)' }}>
        <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-white/60"></div>
      </div>
      
      {/* Фото-лента или скотч (декор) */}
      <div className="absolute -top-2 right-[-10%] w-12 h-6 bg-white/20 backdrop-blur-sm shadow-sm rotate-[15deg]"></div>

      <div className="text-[10px] font-bold mb-2 opacity-50 uppercase tracking-widest border-b border-black/10 pb-1">
        {data.typeLabel}
      </div>
      <div className="text-sm font-semibold leading-snug">
        {data.label}
      </div>

      <Handle type="target" position={Position.Top} className="opacity-0 w-8 h-8 -top-4" />
      <Handle type="source" position={Position.Bottom} className="opacity-0 w-8 h-8 -bottom-4" />
    </div>
  );
}

const nodeTypes = {
  evidence: EvidenceNode,
};

function FlowEditor({ slug, mapId, initialMap, canEdit }: { slug: string; mapId: string; initialMap: MapData; canEdit: boolean }) {
  // Инициализация графа React Flow
  const initialNodes: FlowNode[] = initialMap.nodes.map((n, i) => ({
    id: n.id,
    type: 'evidence',
    position: n.position || { x: 100 + (i * 200) % 800, y: 100 + Math.floor(i / 4) * 150 },
    data: { 
      label: n.label, 
      typeLabel: NODE_TYPE_LABEL[n.type] ?? n.type,
      rotation: (Math.random() - 0.5) * 6, // Случайный наклон от -3 до 3 градусов
    },
    draggable: canEdit,
  }));

  const initialFlowEdges: Edge[] = initialMap.edges.map(e => ({
    id: e.id,
    source: e.fromNodeId,
    target: e.toNodeId,
    type: 'default',
    animated: false,
    style: { 
      stroke: '#dc2626', // Красная нить
      strokeWidth: 4, 
      filter: 'drop-shadow(0px 8px 4px rgba(0,0,0,0.6))', 
      strokeLinecap: 'round' 
    },
  }));

  const [nodes, setNodes] = useState<FlowNode[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialFlowEdges);
  const [pending, setPending] = useState('');
  
  // UI стейт для создания через панель
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeType, setNodeType] = useState<'source' | 'thesis' | 'discussion'>('thesis');

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // Сохранение позиции при перетаскивании
  const onNodeDragStop = useCallback(async (event: React.MouseEvent, node: FlowNode) => {
    if (!canEdit) return;
    try {
      await fetch(`/api/universes/${slug}/mind-maps/${mapId}/nodes/${node.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: node.position })
      });
    } catch (e) {
      console.error("Failed to save position", e);
    }
  }, [slug, mapId, canEdit]);

  const onConnect = useCallback(
    async (params: Connection) => {
      if (!canEdit) return;
      setEdges((eds) => xyAddEdge({ 
        ...params, 
        style: { stroke: '#dc2626', strokeWidth: 4, filter: 'drop-shadow(0px 8px 4px rgba(0,0,0,0.6))' } 
      }, eds));
      try {
        await fetch(`/api/universes/${slug}/mind-maps/${mapId}/edges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fromNodeId: params.source, toNodeId: params.target }),
        });
      } catch (e) {
        console.error("Failed to save edge", e);
      }
    },
    [slug, mapId, canEdit]
  );

  async function addNode(e: React.FormEvent) {
    e.preventDefault();
    if (!nodeLabel.trim() || !canEdit) return;
    setPending('node');
    try {
      const res = await fetch(`/api/universes/${slug}/mind-maps/${mapId}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          label: nodeLabel.trim(), 
          type: nodeType,
          position: { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 100 } 
        }),
      });
      if (res.ok) {
        const n = await res.json();
        const newNode: FlowNode = {
          id: n.id,
          type: 'evidence',
          position: n.position || { x: 300, y: 300 },
          data: { label: n.label, typeLabel: NODE_TYPE_LABEL[n.type], rotation: (Math.random() - 0.5) * 6 },
          draggable: true,
        };
        setNodes((nds) => [...nds, newNode]);
        setNodeLabel('');
      }
    } finally {
      setPending('');
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden glass-panel relative shadow-2xl border-none" style={{ width: '100%', minWidth: '100%', flexGrow: 1, alignSelf: 'stretch', height: '80vh', minHeight: 600, display: 'flex' }}>
      
      {/* Декоративное освещение доски */}
      <div className="absolute inset-0 pointer-events-none z-10" style={{ boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8)' }}></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[50vh] pointer-events-none z-10 opacity-30" style={{ background: 'radial-gradient(ellipse at top, #ffffff, transparent)' }}></div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background gap={30} size={1.5} color="rgba(255,255,255,0.2)" style={{ backgroundColor: 'transparent' }} />
        <Controls className="glass-panel border-none shadow-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '10px' }} />
      </ReactFlow>

      {/* Панель добавления (floating widget) */}
      {canEdit && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 glass-panel shadow-2xl p-4 rounded-3xl flex items-center gap-3 border-white/10" style={{ backdropFilter: 'blur(30px)' }}>
          <form onSubmit={addNode} className="flex gap-2">
            <input
              type="text"
              value={nodeLabel}
              onChange={(e) => setNodeLabel(e.target.value)}
              placeholder="Новая зацепка..."
              className="px-4 py-2 rounded-2xl bg-black/30 border border-white/10 text-white outline-none focus:border-[var(--accent-primary)] transition min-w-[200px]"
            />
            <select
              value={nodeType}
              onChange={(e) => setNodeType(e.target.value as any)}
              className="px-4 py-2 rounded-2xl bg-black/30 border border-white/10 text-white outline-none cursor-pointer"
            >
              <option value="thesis">Тезис</option>
              <option value="source">Документ</option>
              <option value="discussion">Связь/Дискуссия</option>
            </select>
            <button
              type="submit"
              disabled={pending !== '' || !nodeLabel.trim()}
              className="px-6 py-2 rounded-2xl bg-[var(--accent-primary)] text-white font-bold hover:scale-105 transition-transform disabled:opacity-50"
            >
              {pending === 'node' ? '...' : <i className="fa-solid fa-plus" />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export function MindMapEditor(props: any) {
  return (
    <ReactFlowProvider>
      <FlowEditor {...props} />
    </ReactFlowProvider>
  );
}
