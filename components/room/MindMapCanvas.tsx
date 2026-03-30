'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useDataChannel, useLocalParticipant } from '@livekit/components-react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
  BackgroundVariant,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  useStore
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction, ranksep: 120, nodesep: 150 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 300, height: 150 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((n) => {
    const nodeWithPosition = dagreGraph.node(n.id);
    return {
      ...n,
      targetPosition: direction === 'LR' ? Position.Left : Position.Top,
      sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
      position: { x: nodeWithPosition.x - 150, y: nodeWithPosition.y - 75 },
    };
  });

  // Ensure edges are preserved
  return { nodes: newNodes, edges: [...edges] };
};

// --- Layer for SVG Freehand Drawing ---
function DrawingLayer({ lines, currentLine }: any) {
  const transform = useStore((s) => s.transform);

  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
      <g transform={`translate(${transform[0]}, ${transform[1]}) scale(${transform[2]})`}>
        {lines.map((l: any, i: number) => (
          <polyline key={i} points={l.points.map((p: any) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={l.color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {currentLine && (
          <polyline points={currentLine.points.map((p: any) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={currentLine.color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        )}
      </g>
    </svg>
  );
}

// --- Layer for Live Cursors ---
function CursorLayer({ cursors }: { cursors: Record<string, any> }) {
  const transform = useStore((s) => s.transform);

  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }}>
      {Object.values(cursors).map((cursor: any) => (
        <g key={cursor.id} transform={`translate(${transform[0] + cursor.x * transform[2]}, ${transform[1] + cursor.y * transform[2]})`}>
          <path d="M5.65376 21.0089L2.8597 2.37446C2.5694 0.439564 4.88722 -0.80373 6.44299 0.457813L21.4172 12.6074C22.973 13.8689 22.1895 16.3262 20.2114 16.3934L14.072 16.6023L9.62002 23.3644C8.59103 24.928 6.00282 23.3355 5.65376 21.0089Z" fill={cursor.color || '#ffb74d'} stroke="white" strokeWidth="1.5" />
          {cursor.name && (
            <text x="14" y="24" fill="white" fontSize="12" fontWeight="bold" stroke="rgba(0,0,0,0.5)" strokeWidth="3" paintOrder="stroke">{cursor.name}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

const availableReactions = ['👍', '💡', '🔥', '💩'];

// --- Custom Editable Node ---
function CustomNode({ id, data, selected }: any) {
  const { updateNodeData } = useReactFlow();

  const handleFocus = (evt: React.FocusEvent<HTMLTextAreaElement>) => {
    // Prevent ReactFlow dragging when editing text
    evt.target.parentElement?.parentElement?.classList.add('nodrag');
  };

  const handleBlur = (evt: React.FocusEvent<HTMLTextAreaElement>) => {
    evt.target.parentElement?.parentElement?.classList.remove('nodrag');
  };

  const onChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(id, { label: evt.target.value });
  };

  const setBg = (color: string) => {
    updateNodeData(id, { bgColor: color });
  };

  const colors = [
    { name: 'dark', val: 'rgba(20, 20, 25, 0.6)' },
    { name: 'green', val: 'rgba(76, 175, 80, 0.4)' },
    { name: 'blue', val: 'rgba(33, 150, 243, 0.4)' },
    { name: 'purple', val: 'rgba(156, 39, 176, 0.4)' },
    { name: 'red', val: 'rgba(244, 67, 54, 0.4)' },
  ];

  const bgColor = data.bgColor || 'rgba(20, 20, 25, 0.6)';

  const handleReaction = (emoji: string) => {
    const reactions = data.reactions || [];
    const existingIndex = reactions.findIndex((r: any) => r.emoji === emoji);
    let newReactions = [...reactions];
    if (existingIndex >= 0) {
      newReactions[existingIndex] = { ...newReactions[existingIndex], count: newReactions[existingIndex].count + 1 };
    } else {
      newReactions.push({ emoji, count: 1 });
    }
    updateNodeData(id, { reactions: newReactions });
  };

  const renderReactions = () => {
    const reactions = data.reactions || [];
    if (reactions.length === 0 && !selected) return null;
    
    return (
      <div className="nodrag flex flex-wrap gap-1 mt-3 justify-center border-t border-white/10 pt-2 w-full">
        {reactions.map((r: any) => (
          <button 
            key={r.emoji} 
            onClick={() => handleReaction(r.emoji)}
            className="flex items-center gap-1 bg-black/30 hover:bg-black/50 border border-white/10 rounded-full px-2 py-0.5 text-xs transition-colors"
          >
            <span>{r.emoji}</span>
            <span className="text-white/70">{r.count}</span>
          </button>
        ))}
        {selected && availableReactions.filter(emoji => !reactions.find((r:any) => r.emoji === emoji)).map(emoji => (
          <button 
            key={emoji} 
            onClick={() => handleReaction(emoji)}
            className="flex items-center justify-center w-6 h-6 bg-white/5 hover:bg-white/20 border border-white/10 rounded-full text-xs opacity-50 hover:opacity-100 transition-all"
          >
            {emoji}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="group" style={{
      background: bgColor,
      color: 'white',
      border: selected ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.08)',
      borderRadius: '20px',
      padding: '16px',
      boxShadow: selected 
        ? '0 0 30px rgba(var(--accent-primary-rgb, 100, 200, 100), 0.3), inset 0 1px 0 rgba(255,255,255,0.1)' 
        : '0 16px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
      backdropFilter: 'blur(30px) saturate(150%)',
      minWidth: '220px',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      position: 'relative',
    }}>
      {/* Ручки соединения (Handles) */}
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ 
          background: 'var(--accent-primary)', 
          width: 14, height: 14, 
          border: '2px solid rgba(255,255,255,0.8)',
          boxShadow: '0 0 12px var(--accent-primary)',
          top: -7
        }} 
      />
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <textarea
          defaultValue={data.label}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Введите идею..."
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '1rem',
            fontWeight: 500,
            lineHeight: 1.4,
            resize: 'none',
            outline: 'none',
            minHeight: '60px',
            fontFamily: 'inherit',
            textAlign: 'center'
          }}
        />
        
        {selected && (
          <div className="nodrag" style={{ display: 'flex', gap: 6, justifyContent: 'center', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {colors.map(c => (
              <div 
                key={c.name} 
                onClick={() => setBg(c.val)}
                style={{ 
                  width: 16, height: 16, borderRadius: '50%', background: c.val, 
                  cursor: 'pointer', border: bgColor === c.val ? '2px solid white' : '1px solid rgba(255,255,255,0.3)' 
                }} 
              />
            ))}
          </div>
        )}
        {renderReactions()}
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ 
          background: 'var(--accent-primary)', 
          width: 14, height: 14, 
          border: '2px solid rgba(255,255,255,0.8)',
          boxShadow: '0 0 12px var(--accent-primary)',
          bottom: -7
        }} 
      />
    </div>
  );
}

// --- Dynamic Post Node ---
function PostNode({ id, data, selected }: any) {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { updateNodeData } = useReactFlow();

  useEffect(() => {
    if (!data.contentId) {
      setLoading(false);
      return;
    }
    fetch(`/api/content/${data.contentId}`)
      .then(r => r.json())
      .then(d => {
        setPost(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [data.contentId]);

  const bgColor = data.bgColor || 'rgba(20, 20, 25, 0.8)';

  const handleReaction = (emoji: string) => {
    const reactions = data.reactions || [];
    const existingIndex = reactions.findIndex((r: any) => r.emoji === emoji);
    let newReactions = [...reactions];
    if (existingIndex >= 0) {
      newReactions[existingIndex] = { ...newReactions[existingIndex], count: newReactions[existingIndex].count + 1 };
    } else {
      newReactions.push({ emoji, count: 1 });
    }
    updateNodeData(id, { reactions: newReactions });
  };

  const renderReactions = () => {
    const reactions = data.reactions || [];
    if (reactions.length === 0 && !selected) return null;
    
    return (
      <div className="nodrag flex flex-wrap gap-1 mt-3 justify-center border-t border-white/10 pt-2 w-full">
        {reactions.map((r: any) => (
          <button 
            key={r.emoji} 
            onClick={() => handleReaction(r.emoji)}
            className="flex items-center gap-1 bg-black/30 hover:bg-black/50 border border-white/10 rounded-full px-2 py-0.5 text-xs transition-colors"
          >
            <span>{r.emoji}</span>
            <span className="text-white/70">{r.count}</span>
          </button>
        ))}
        {selected && availableReactions.filter(emoji => !reactions.find((r:any) => r.emoji === emoji)).map(emoji => (
          <button 
            key={emoji} 
            onClick={() => handleReaction(emoji)}
            className="flex items-center justify-center w-6 h-6 bg-white/5 hover:bg-white/20 border border-white/10 rounded-full text-xs opacity-50 hover:opacity-100 transition-all"
          >
            {emoji}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="group" style={{
      background: bgColor,
      color: 'white',
      border: selected ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.08)',
      borderRadius: '20px',
      padding: '16px',
      boxShadow: selected 
        ? '0 0 30px rgba(var(--accent-primary-rgb, 100, 200, 100), 0.3), inset 0 1px 0 rgba(255,255,255,0.1)' 
        : '0 16px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
      backdropFilter: 'blur(30px) saturate(150%)',
      minWidth: '260px',
      maxWidth: '320px',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      position: 'relative',
    }}>
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ 
          background: 'var(--accent-primary)', 
          width: 14, height: 14, 
          border: '2px solid rgba(255,255,255,0.8)',
          boxShadow: '0 0 12px var(--accent-primary)',
          top: -7
        }} 
      />

      {loading ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Загрузка поста...</div>
      ) : post ? (
        <div className="nodrag" style={{ cursor: 'text' }}>
          {post.imageUrl && (
            <img 
              src={post.imageUrl} 
              alt="Post Image" 
              style={{ width: '100%', borderRadius: '12px', marginBottom: '12px', maxHeight: '160px', objectFit: 'cover' }} 
            />
          )}
          <div style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '8px', lineHeight: 1.3 }}>
            {post.title || 'Публикация'}
          </div>
          <div style={{ 
            fontSize: '0.9rem', 
            color: 'rgba(255, 255, 255, 0.7)', 
            display: '-webkit-box', 
            WebkitLineClamp: 3, 
            WebkitBoxOrient: 'vertical', 
            overflow: 'hidden' 
          }}>
            {post.text || post.content || ''}
          </div>
          {post.author && (
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
              {post.author.image ? (
                <img src={post.author.image} alt="Author" style={{ width: 20, height: 20, borderRadius: '50%' }} />
              ) : (
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-primary)' }} />
              )}
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{post.author.name || 'Аноним'}</span>
            </div>
          )}
          {renderReactions()}
        </div>
      ) : (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-danger)', fontSize: '0.9rem' }}>
          Пост не найден
        </div>
      )}

      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ 
          background: 'var(--accent-primary)', 
          width: 14, height: 14, 
          border: '2px solid rgba(255,255,255,0.8)',
          boxShadow: '0 0 12px var(--accent-primary)',
          bottom: -7
        }} 
      />
    </div>
  );
}

// --- Media Node ---
function MediaNode({ id, data, selected }: any) {
  const { updateNodeData } = useReactFlow();

  const handleReaction = (emoji: string) => {
    const reactions = data.reactions || [];
    const existingIndex = reactions.findIndex((r: any) => r.emoji === emoji);
    let newReactions = [...reactions];
    if (existingIndex >= 0) {
      newReactions[existingIndex] = { ...newReactions[existingIndex], count: newReactions[existingIndex].count + 1 };
    } else {
      newReactions.push({ emoji, count: 1 });
    }
    updateNodeData(id, { reactions: newReactions });
  };

  const renderReactions = () => {
    const reactions = data.reactions || [];
    if (reactions.length === 0 && !selected) return null;
    
    return (
      <div className="nodrag flex flex-wrap gap-1 mt-3 justify-center border-t border-white/10 pt-2 w-full">
        {reactions.map((r: any) => (
          <button 
            key={r.emoji} 
            onClick={() => handleReaction(r.emoji)}
            className="flex items-center gap-1 bg-black/30 hover:bg-black/50 border border-white/10 rounded-full px-2 py-0.5 text-xs transition-colors"
          >
            <span>{r.emoji}</span>
            <span className="text-white/70">{r.count}</span>
          </button>
        ))}
        {selected && availableReactions.filter(emoji => !reactions.find((r:any) => r.emoji === emoji)).map(emoji => (
          <button 
            key={emoji} 
            onClick={() => handleReaction(emoji)}
            className="flex items-center justify-center w-6 h-6 bg-white/5 hover:bg-white/20 border border-white/10 rounded-full text-xs opacity-50 hover:opacity-100 transition-all"
          >
            {emoji}
          </button>
        ))}
      </div>
    );
  };

  const isYoutube = data.url?.includes('youtube.com') || data.url?.includes('youtu.be');
  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const bgColor = data.bgColor || 'rgba(20, 20, 25, 0.8)';

  return (
    <div className="group" style={{
      background: bgColor,
      color: 'white',
      border: selected ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.08)',
      borderRadius: '20px',
      padding: '16px',
      boxShadow: selected 
        ? '0 0 30px rgba(var(--accent-primary-rgb, 100, 200, 100), 0.3), inset 0 1px 0 rgba(255,255,255,0.1)' 
        : '0 16px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
      backdropFilter: 'blur(30px) saturate(150%)',
      minWidth: '260px',
      maxWidth: '350px',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      position: 'relative',
    }}>
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ 
          background: 'var(--accent-primary)', 
          width: 14, height: 14, 
          border: '2px solid rgba(255,255,255,0.8)',
          boxShadow: '0 0 12px var(--accent-primary)',
          top: -7
        }} 
      />

      <div className="nodrag w-full flex flex-col items-center">
        {isYoutube ? (
          <iframe 
            width="100%" 
            height="180" 
            src={`https://www.youtube.com/embed/${getYoutubeId(data.url)}`}
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            style={{ borderRadius: '12px', pointerEvents: 'auto' }}
          />
        ) : (
          <img 
            src={data.url} 
            alt="Media" 
            style={{ width: '100%', maxHeight: '200px', borderRadius: '12px', objectFit: 'cover' }} 
            onError={(e) => { (e.target as any).src = 'https://placehold.co/400x200?text=Invalid+Image' }}
          />
        )}
        {renderReactions()}
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ 
          background: 'var(--accent-primary)', 
          width: 14, height: 14, 
          border: '2px solid rgba(255,255,255,0.8)',
          boxShadow: '0 0 12px var(--accent-primary)',
          bottom: -7
        }} 
      />
    </div>
  );
}

const nodeTypes = {
  custom: CustomNode,
  post: PostNode,
  media: MediaNode
};

// --- Main Component ---
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'custom',
    data: { label: 'Новая идея...', bgColor: 'rgba(20, 20, 25, 0.6)' },
    position: { x: 250, y: 250 },
  },
];

const initialEdges: Edge[] = [];

export function MindMapInner() {
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);
  const { fitView, screenToFlowPosition } = useReactFlow();

  // Drawing mode state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [lines, setLines] = useState<any[]>([]); 
  const [currentLine, setCurrentLine] = useState<any>(null);

  // Fullscreen state
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => console.error("Error fullscreen", err));
    } else {
      document.exitFullscreen();
    }
  };

  // Live Cursors state
  const { localParticipant } = useLocalParticipant();
  const [cursors, setCursors] = useState<Record<string, any>>({});
  const lastCursorSend = useRef(0);

  // We listen to data channel messages to apply changes from others
  const handleDataMessage = useCallback((msg: any) => {
    try {
      const data = JSON.parse(new TextDecoder().decode(msg.payload));
      if (data.type === 'SYNC_NODES') {
        const localSelectedIds = new Set(nodes.filter(n => n.selected).map(n => n.id));
        const mergedNodes = data.nodes.map((remoteNode: Node) => ({
          ...remoteNode,
          selected: localSelectedIds.has(remoteNode.id)
        }));
        setNodes(mergedNodes);
        setEdges(data.edges);
      } else if (data.type === 'CURSOR') {
        setCursors(prev => ({
          ...prev,
          [data.id]: { id: data.id, x: data.x, y: data.y, name: data.name, color: data.color }
        }));
      }
    } catch (e) {
      console.error('Failed to parse mindmap payload', e);
    }
  }, [setNodes, setEdges, nodes]);

  const sendData = useDataChannel('mindmap', handleDataMessage);

  // Sync to other users when local changes happen
  const broadcastSync = (newNodes: Node[], newEdges: Edge[]) => {
    try {
      const payload = JSON.stringify({ type: 'SYNC_NODES', nodes: newNodes, edges: newEdges });
      const promise = sendData.send(new TextEncoder().encode(payload), { reliable: true });
      if (promise && promise.catch) {
        promise.catch((e: any) => console.warn('Failed to broadcast sync (async)', e));
      }
    } catch (e) {
      console.warn('Failed to broadcast sync (sync)', e);
    }
  };

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const next = applyNodeChanges(changes, nds);
        // If it was a drag, size change, or local data update, broadcast it
        if (changes.some(c => c.type === 'position' || c.type === 'remove' || (c.type as any) === 'replace')) {
          broadcastSync(next, edges);
        }
        return next;
      });
    },
    [edges, setNodes, sendData]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => {
        const next = applyEdgeChanges(changes, eds);
        broadcastSync(nodes, next);
        return next;
      });
    },
    [nodes, setEdges, sendData]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => {
        const next = addEdge({ 
          ...params, 
          type: 'smoothstep', 
          animated: true, 
          style: { stroke: 'var(--accent-primary)', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--accent-primary)' }
        }, eds);
        broadcastSync(nodes, next);
        return next;
      });
    },
    [nodes, setEdges, sendData]
  );

  const addNode = () => {
    const newNode: Node = {
      id: crypto.randomUUID(),
      type: 'custom',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { label: `Новая идея`, bgColor: 'rgba(20, 20, 25, 0.6)' },
    };
    setNodes((nds) => {
      const next = [...nds, newNode];
      broadcastSync(next, edges);
      return next;
    });
  };

  const addPostNode = () => {
    const input = window.prompt('Вставьте ссылку на пост или ID поста Roominate:');
    if (!input) return;

    // Пытаемся вытащить UUID поста из любой вставленной ссылки/строки
    const match = input.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
    const contentId = match ? match[0] : input.trim();

    const newNode: Node = {
      id: crypto.randomUUID(),
      type: 'post',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { contentId, bgColor: 'rgba(20, 20, 25, 0.8)' },
    };
    
    setNodes((nds) => {
      const next = [...nds, newNode];
      broadcastSync(next, edges);
      return next;
    });
  };

  const addMediaNode = () => {
    const url = window.prompt('Вставьте ссылку на картинку или YouTube видео:');
    if (!url) return;

    const newNode: Node = {
      id: crypto.randomUUID(),
      type: 'media',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { url, bgColor: 'rgba(20, 20, 25, 0.8)', type: 'media' },
    };
    
    setNodes((nds) => {
      const next = [...nds, newNode];
      broadcastSync(next, edges);
      return next;
    });
  };

  const onGlobalPointerMove = useCallback((e: React.PointerEvent) => {
    if (isDrawingMode && currentLine) {
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setCurrentLine({ ...currentLine, points: [...currentLine.points, pos] });
    }

    // Always broadcast cursor occasionally
    if (Date.now() - lastCursorSend.current > 60) {
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const payload = JSON.stringify({ 
        type: 'CURSOR', 
        id: localParticipant.identity, 
        name: localParticipant.name || 'Коллега', 
        color: '#ffb74d', 
        x: pos.x, 
        y: pos.y 
      });
      // Reliable = false prevents blocking WebRTC with cursor spam
      try {
        const promise = sendData.send(new TextEncoder().encode(payload), { reliable: false });
        if (promise && promise.catch) promise.catch(() => {});
        lastCursorSend.current = Date.now();
      } catch (err) {}
    }
  }, [isDrawingMode, currentLine, screenToFlowPosition, localParticipant, sendData]);

  const onGlobalPointerDown = useCallback((e: React.PointerEvent) => {
    if (!isDrawingMode) return;
    (e.target as any).releasePointerCapture(e.pointerId);
    const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setCurrentLine({ points: [pos], color: '#ffb74d' });
  }, [isDrawingMode, screenToFlowPosition]);

  const onGlobalPointerUp = useCallback(() => {
    if (!isDrawingMode || !currentLine) return;
    setLines((prev) => [...prev, currentLine]);
    setCurrentLine(null);
  }, [isDrawingMode, currentLine]);

  // Auto clean stale cursors
  useEffect(() => {
    const t = setInterval(() => {
      setCursors({}); // Clears everyone off-screen periodically to prevent ghosts
      // In a real app we'd track timestamp of last move per ID
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const deleteSelected = () => {
    const selectedNodes = nodes.filter(n => n.selected);
    const selectedEdges = edges.filter(e => e.selected);
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;

    setNodes(nds => {
      const remaining = nds.filter(n => !n.selected);
      setEdges(eds => {
        const remainingEdges = eds.filter(e => !e.selected);
        broadcastSync(remaining, remainingEdges);
        return remainingEdges;
      });
      return remaining;
    });
  };

  // Listen to deep data changes (since node.data is mutated by custom nodes)
  useEffect(() => {
    const t = setTimeout(() => {
      broadcastSync(nodes, edges);
    }, 500);
    return () => clearTimeout(t);
  }, [nodes.map(n => JSON.stringify(n.data)).join(','), broadcastSync]);

  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
    broadcastSync(layoutedNodes, layoutedEdges);
    window.requestAnimationFrame(() => fitView({ duration: 800 }));
  }, [nodes, edges, setNodes, setEdges, broadcastSync, fitView]);

  return (
    <div 
      ref={containerRef} 
      style={{ width: '100%', height: '100%', position: 'relative', background: 'rgba(0,0,0,0.3)', borderRadius: isFullscreen ? 0 : 'var(--radius-xl)', overflow: 'hidden' }}
      onPointerMove={onGlobalPointerMove}
      onPointerDown={onGlobalPointerDown}
      onPointerUp={onGlobalPointerUp}
      onPointerLeave={onGlobalPointerUp}
    >
      
      {isDrawingMode && (
        <div 
          style={{ position: 'absolute', inset: 0, zIndex: 5, cursor: 'crosshair', touchAction: 'none' }}
        />
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        panOnDrag={!isDrawingMode}
        panOnScroll={!isDrawingMode}
        zoomOnScroll={!isDrawingMode}
        zoomOnPinch={!isDrawingMode}
        zoomOnDoubleClick={!isDrawingMode}
        fitView
      >
        <Controls style={{ background: 'rgba(20,20,25,0.6)', fill: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden', backdropFilter: 'blur(20px)' }} />
        <Background variant={BackgroundVariant.Dots} gap={24} size={2} color="rgba(255,255,255,0.06)" />
        <DrawingLayer lines={lines} currentLine={currentLine} />
      </ReactFlow>

      <CursorLayer cursors={cursors} />

      <div className="glass-panel" style={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 16,
          zIndex: 10,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 8,
          padding: 8,
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          background: 'color-mix(in srgb, var(--bg-secondary) 50%, rgba(0,0,0,0.4))'
      }}>
        <button 
          onClick={addNode}
          className="btn-glow"
          style={{
            background: 'var(--accent-primary)',
            color: 'white',
            padding: '6px 14px',
            fontSize: '0.85rem',
            borderRadius: '10px',
            fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <i className="fas fa-plus mr-1.5" /> Добавить мысль
        </button>
        <button 
          onClick={() => setIsDrawingMode(!isDrawingMode)}
          className={`btn-glow transition-colors ${isDrawingMode ? 'bg-[rgba(255,152,0,0.4)]' : 'hover:bg-[rgba(255,152,0,0.3)]'}`}
          style={{
            background: isDrawingMode ? 'rgba(255, 152, 0, 0.4)' : 'rgba(255, 152, 0, 0.15)',
            color: '#ffb74d',
            padding: '6px 14px',
            fontSize: '0.85rem',
            borderRadius: '10px',
            fontWeight: 600,
            border: '1px solid rgba(255, 152, 0, 0.4)'
          }}
        >
          <i className="fas fa-pencil-alt mr-1.5" /> {isDrawingMode ? 'Закончить рисовать' : 'Рисовать'}
        </button>
        <button 
          onClick={addPostNode}
          className="btn-glow"
          style={{
            background: 'rgba(33, 150, 243, 0.2)',
            color: '#64b5f6',
            padding: '6px 14px',
            fontSize: '0.85rem',
            borderRadius: '10px',
            fontWeight: 600,
            border: '1px solid rgba(33, 150, 243, 0.4)'
          }}
        >
          <i className="fas fa-file-alt mr-1.5" /> Добавить пост
        </button>
        <button 
          onClick={addMediaNode}
          className="btn-glow hover:bg-[rgba(255,152,0,0.3)] transition-colors"
          style={{
            background: 'rgba(255, 152, 0, 0.2)',
            color: '#ffb74d',
            padding: '6px 14px',
            fontSize: '0.85rem',
            borderRadius: '10px',
            fontWeight: 600,
            border: '1px solid rgba(255, 152, 0, 0.4)'
          }}
        >
          <i className="fas fa-play mr-1.5" /> Медиа
        </button>
        <button 
          onClick={onLayout}
          className="btn-glow hover:bg-[rgba(76,175,80,0.3)] transition-colors"
          style={{
            background: 'rgba(76, 175, 80, 0.2)',
            color: '#81c784',
            padding: '6px 14px',
            fontSize: '0.85rem',
            borderRadius: '10px',
            fontWeight: 600,
            border: '1px solid rgba(76, 175, 80, 0.4)'
          }}
        >
          <i className="fas fa-magic mr-1.5" /> Упорядочить
        </button>
        <button 
          onClick={deleteSelected}
          style={{
            background: 'rgba(244, 67, 54, 0.15)',
            color: '#f44336',
            border: '1px solid rgba(244, 67, 54, 0.3)',
            padding: '6px 14px',
            fontSize: '0.85rem',
            borderRadius: '10px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          className="hover:bg-[rgba(244,67,54,0.25)]"
        >
          <i className="fas fa-trash-alt mr-1.5" /> Удалить выбранное
        </button>
        <button 
          onClick={toggleFullscreen}
          className="btn-glow hover:bg-[rgba(255,255,255,0.2)] transition-colors"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            padding: '6px 14px',
            fontSize: '0.85rem',
            borderRadius: '10px',
            fontWeight: 600,
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'} mr-1.5`} /> {isFullscreen ? 'Свернуть' : 'На весь экран'}
        </button>
      </div>
    </div>
  );
}

export function MindMapCanvas() {
  return (
    <ReactFlowProvider>
      <MindMapInner />
    </ReactFlowProvider>
  );
}
