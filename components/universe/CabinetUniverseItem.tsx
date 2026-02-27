'use client';

import Link from 'next/link';
import { SferaSphereIcon } from '@/components/SferaSphereIcon';
import { DeleteUniverseButton } from '@/app/universes/[slug]/DeleteUniverseButton';
import { formatUpdated } from '@/lib/utils/date';

export interface CabinetUniverseItemProps {
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sphereColor?: string | null;
  updatedAt: Date;
  isOwner?: boolean;
  showDelete?: boolean;
}

function QuickActions({ slug }: { slug: string }) {
  return (
    <div className="cabinet-quick-actions" style={{ display: 'flex', gap: 6 }}>
      <Link
        href={`/universes/${encodeURIComponent(slug)}/content`}
        className="cabinet-quick-action"
        title="Лента контента"
      >
        <i className="fas fa-align-left" aria-hidden />
      </Link>
      <Link href="/me/content" className="cabinet-quick-action" title="Сборка">
        <i className="fas fa-layer-group" aria-hidden />
      </Link>
    </div>
  );
}

export function CabinetUniverseItem({
  slug,
  name,
  description,
  icon: _icon,
  sphereColor,
  updatedAt,
  isOwner = false,
  showDelete = false,
}: CabinetUniverseItemProps) {
  const href = `/universes/${encodeURIComponent(slug)}`;
  const formattedDate = formatUpdated(updatedAt);

  if (isOwner && showDelete) {
    return (
      <div
        className="cabinet-universe-item"
        style={{ position: 'relative', paddingRight: '130px' }}
      >
        <Link
          href={href}
          style={{ display: 'flex', alignItems: 'center', flex: 1, textDecoration: 'none', color: 'inherit', gap: '18px' }}
        >
          <div className="cabinet-universe-icon cabinet-universe-icon--sphere">
            <SferaSphereIcon size="sm" color={sphereColor} />
          </div>
          <div className="cabinet-universe-info">
            <div className="cabinet-universe-name">{name}</div>
            <div className="cabinet-universe-desc">
              {description ? `${description.slice(0, 40)}${description.length > 40 ? '…' : ''}` : 'Сфера'}
              {' · '}
              обновлено {formattedDate}
            </div>
          </div>
        </Link>
        <QuickActions slug={slug} />
        <DeleteUniverseButton slug={slug} universeName={name} />
      </div>
    );
  }

  return (
    <div className="cabinet-universe-item" style={{ position: 'relative', paddingRight: '130px' }}>
      <Link
        href={href}
        style={{ display: 'flex', alignItems: 'center', flex: 1, textDecoration: 'none', color: 'inherit', gap: '18px' }}
      >
        <div className="cabinet-universe-icon cabinet-universe-icon--sphere">
          <SferaSphereIcon size="sm" color={sphereColor} />
        </div>
        <div className="cabinet-universe-info">
          <div className="cabinet-universe-name">{name}</div>
          <div className="cabinet-universe-desc">
            {description ? `${description.slice(0, 40)}${description.length > 40 ? '…' : ''}` : 'Сфера'}
            {' · '}
            обновлено {formattedDate}
          </div>
        </div>
      </Link>
      <QuickActions slug={slug} />
    </div>
  );
}
