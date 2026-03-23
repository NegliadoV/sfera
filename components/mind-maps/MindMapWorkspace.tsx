'use client';

import { useState } from 'react';
import { PersonalMindMapCanvas } from './PersonalMindMapCanvas';
import { PersonalSphereViewer } from './PersonalSphereViewer';

export function MindMapWorkspace({ mapId, initialNodes, initialEdges }: any) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  return (
    <div className="w-full h-full flex overflow-hidden rounded-xl bg-[rgba(0,0,0,0.3)] shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/5">
      {/* Левая часть: Ментальная карта */}
      <div className="flex-1 min-w-0 relative h-full">
        <PersonalMindMapCanvas 
          mapId={mapId} 
          initialNodes={initialNodes} 
          initialEdges={initialEdges} 
          onOpenViewer={() => setIsViewerOpen(true)}
          isViewerOpen={isViewerOpen}
        />
      </div>
      
      {/* Правая часть: Сферы (Split Screen) */}
      {isViewerOpen && (
        <div style={{ width: '450px', minWidth: '300px', maxWidth: '50vw', height: '100%', borderLeft: '1px solid rgba(255,255,255,0.1)' }} className="animate-in slide-in-from-right-8 duration-300">
          <PersonalSphereViewer onClose={() => setIsViewerOpen(false)} />
        </div>
      )}
    </div>
  );
}
