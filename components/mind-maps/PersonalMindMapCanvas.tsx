'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
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
import { DeleteMindMapButton } from './DeleteMindMapButton';

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

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = direction === 'LR' ? Position.Left : Position.Top;
    node.sourcePosition = direction === 'LR' ? Position.Right : Position.Bottom;
    node.position = {
      x: nodeWithPosition.x - 150,
      y: nodeWithPosition.y - 75,
    };
  });

  return { nodes, edges };
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

const availableReactions = ['👍', '💡', '🔥', '💩'];

// --- Custom Editable Node ---
function CustomNode({ id, data, selected }: any) {
  const { updateNodeData } = useReactFlow();

  const handleFocus = (evt: React.FocusEvent<HTMLTextAreaElement>) => {
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

const generateDefaultElements = () => {
  if (typeof crypto === 'undefined' || !crypto.randomUUID) return { nodes: [], edges: [] };
  const id1 = crypto.randomUUID();
  const id2 = crypto.randomUUID();
  const id3 = crypto.randomUUID();
  
  const defaultInitialNodes: Node[] = [
    {
      id: id1,
      type: 'custom',
      data: { label: '👋 Добро пожаловать!\nЭто ваша новая Личная Карта.', bgColor: 'rgba(33, 150, 243, 0.8)' },
      position: { x: 250, y: 100 },
    },
    {
      id: id2,
      type: 'custom',
      data: { label: 'Здесь можно визуализировать идеи, собирать конспекты и ставить 💡', bgColor: 'rgba(20, 20, 25, 0.8)' },
      position: { x: 100, y: 250 },
    },
    {
      id: id3,
      type: 'custom',
      data: { label: 'Вставьте ссылку на YouTube\nчерез кнопку "Медиа"!', bgColor: 'rgba(244, 67, 54, 0.6)' },
      position: { x: 400, y: 250 },
    }
  ];

  const defaultInitialEdges: Edge[] = [
    { id: crypto.randomUUID(), source: id1, target: id2, type: 'smoothstep', animated: true, style: { stroke: 'var(--accent-primary)', strokeWidth: 2 } },
    { id: crypto.randomUUID(), source: id1, target: id3, type: 'smoothstep', animated: true, style: { stroke: 'var(--accent-primary)', strokeWidth: 2 } },
  ];

  return { nodes: defaultInitialNodes, edges: defaultInitialEdges };
};

export function PersonalMindMapInner(props: any) {
  const { mapId, initialNodes, initialEdges, onOpenViewer, isViewerOpen } = props;
  
  const [initialDefaults] = useState(() => generateDefaultElements());
  
  const [nodes, setNodes] = useNodesState(initialNodes?.length > 0 ? initialNodes : initialDefaults.nodes);
  const [edges, setEdges] = useEdgesState(initialEdges?.length > 0 ? initialEdges : initialDefaults.edges);
  const { fitView, screenToFlowPosition } = useReactFlow();
  const savingRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Drawing mode state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [lines, setLines] = useState<any[]>([]); // Note: save lines to DB here if needed
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

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!isDrawingMode) return;
    (e.target as any).releasePointerCapture(e.pointerId); // Fix for capture issues
    const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setCurrentLine({ points: [pos], color: '#ffb74d' });
  }, [isDrawingMode, screenToFlowPosition]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawingMode || !currentLine) return;
    const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setCurrentLine({ ...currentLine, points: [...currentLine.points, pos] });
  }, [isDrawingMode, currentLine, screenToFlowPosition]);

  const onPointerUp = useCallback(() => {
    if (!isDrawingMode || !currentLine) return;
    setLines((prev) => [...prev, currentLine]);
    setCurrentLine(null);
  }, [isDrawingMode, currentLine]);

  const saveToDb = useCallback(async (currentNodes: Node[], currentEdges: Edge[]) => {
    if (savingRef.current) return;
    
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    
    syncTimeoutRef.current = setTimeout(async () => {
      savingRef.current = true;
      try {
        await fetch(`/api/me/mind-maps/${mapId}/sync`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodes: currentNodes, edges: currentEdges }),
        });
      } catch(e) {
        console.error('Failed to sync mind map', e);
      } finally {
        savingRef.current = false;
      }
    }, 3000); // 3s debounce
  }, [mapId]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const next = applyNodeChanges(changes, nds);
        // Save if position or selection changes, or nodes removed
        if (changes.some(c => c.type === 'position' || c.type === 'remove' || (c.type as any) === 'replace')) {
          saveToDb(next, edges);
        }
        return next;
      });
    },
    [edges, setNodes, saveToDb]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => {
        const next = applyEdgeChanges(changes, eds);
        saveToDb(nodes, next);
        return next;
      });
    },
    [nodes, setEdges, saveToDb]
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
        saveToDb(nodes, next);
        return next;
      });
    },
    [nodes, setEdges, saveToDb]
  );

  const addNode = () => {
    const newNode: Node = {
      id: crypto.randomUUID(),
      type: 'custom',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { label: `Новая идея`, bgColor: 'rgba(20, 20, 25, 0.6)', type: 'custom' },
    };
    setNodes((nds) => {
      const next = [...nds, newNode];
      saveToDb(next, edges);
      return next;
    });
  };

  const addPostNode = () => {
    const input = window.prompt('Вставьте ссылку на пост или ID поста Roominate:');
    if (!input) return;

    const match = input.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
    const contentId = match ? match[0] : input.trim();

    const newNode: Node = {
      id: crypto.randomUUID(),
      type: 'post',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { contentId, bgColor: 'rgba(20, 20, 25, 0.8)', type: 'post' },
    };
    
    setNodes((nds) => {
      const next = [...nds, newNode];
      saveToDb(next, edges);
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
      saveToDb(next, edges);
      return next;
    });
  };

  const deleteSelected = () => {
    const selectedNodes = nodes.filter(n => n.selected);
    const selectedEdges = edges.filter(e => e.selected);
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;

    setNodes(nds => {
      const remaining = nds.filter(n => !n.selected);
      setEdges(eds => {
        const remainingEdges = eds.filter(e => !e.selected);
        saveToDb(remaining, remainingEdges);
        return remainingEdges;
      });
      return remaining;
    });
  };

  // Listen to deep data changes (node text / color edits)
  useEffect(() => {
    const t = setTimeout(() => {
      saveToDb(nodes, edges);
    }, 1000);
    return () => clearTimeout(t);
  }, [nodes.map(n => (n.data as any)?.label + (n.data as any)?.bgColor).join(','), saveToDb]);

  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
    saveToDb(layoutedNodes, layoutedEdges);
    window.requestAnimationFrame(() => fitView({ duration: 800 }));
  }, [nodes, edges, setNodes, setEdges, fitView, saveToDb]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', background: 'rgba(0,0,0,0.3)', borderRadius: isFullscreen ? 0 : 'var(--radius-xl)', overflow: 'hidden' }}>
      
      {isDrawingMode && (
        <div 
          style={{ position: 'absolute', inset: 0, zIndex: 5, cursor: 'crosshair', touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerUp}
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
        {mapId && <DeleteMindMapButton mapId={mapId} mapTitle="эту карту" redirectOnDelete={true} />}
        <button 
          onClick={onOpenViewer}
          style={{
            background: 'rgba(156, 39, 176, 0.2)',
            color: '#ce93d8',
            padding: '6px 14px',
            fontSize: '0.85rem',
            borderRadius: '10px',
            fontWeight: 600,
            border: '1px solid rgba(156, 39, 176, 0.4)',
            display: isViewerOpen ? 'none' : 'block'
          }}
          className="btn-glow hover:bg-[rgba(156,39,176,0.3)] transition-colors"
        >
          <i className="fas fa-globe mr-1.5" /> Сфера
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

export function PersonalMindMapCanvas(props: any) {
  return (
    <ReactFlowProvider>
      <PersonalMindMapInner {...props} />
    </ReactFlowProvider>
  );
}
