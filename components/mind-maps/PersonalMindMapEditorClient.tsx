'use client';

import Link from 'next/link';
import { useTranslation } from '@/components/i18n/LanguageProvider';
import { MindMapWorkspace } from './MindMapWorkspace';

interface PersonalMindMapEditorClientProps {
  mapId: string;
  mapTitle: string;
  initialNodes: any[];
  initialEdges: any[];
}

export function PersonalMindMapEditorClient({ mapId, mapTitle, initialNodes, initialEdges }: PersonalMindMapEditorClientProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col w-full h-full" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="platform-breadcrumb shrink-0 px-6 pt-6 pb-2">
        <Link href="/rooms">{t('nav.rooms', 'Комнаты')}</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <Link href="/me/mind-maps">{t('mindMaps.myMaps', 'Мои Карты')}</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>{mapTitle}</span>
      </div>

      <div className="flex-1 w-full relative px-6 pb-6">
        <div className="w-full h-full relative">
          <MindMapWorkspace mapId={mapId} initialNodes={initialNodes} initialEdges={initialEdges} />
        </div>
      </div>
    </div>
  );
}
