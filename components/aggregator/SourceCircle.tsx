'use client';

import Link from 'next/link';

function getProviderIcon(provider: string): string {
  switch (provider) {
    case 'rss':
      return 'fa-solid fa-rss';
    case 'youtube':
      return 'fa-brands fa-youtube';
    case 'podcast':
      return 'fa-solid fa-podcast';
    case 'telegram':
      return 'fa-brands fa-telegram';
    case 'manual':
      return 'fa-solid fa-keyboard';
    default:
      return 'fa-solid fa-link';
  }
}

export interface SourceCircleProps {
  id: string;
  name: string;
  provider: string;
  url?: string | null;
  enabled: boolean;
  canEdit: boolean;
  universeSlug: string;
  onToggle?: (sourceId: string, enabled: boolean) => void;
}

export function SourceCircle({
  id,
  name,
  provider,
  enabled,
  canEdit,
  universeSlug,
  onToggle,
}: SourceCircleProps) {
  const iconClass = getProviderIcon(provider);
  const sourceHref = `/universes/${encodeURIComponent(universeSlug)}/sources/${id}`;

  const circleContent = (
    <>
      <div className={`universes-circle-logo ${!enabled ? 'sources-circle-logo--disabled' : ''}`}>
        <i className={iconClass} aria-hidden />
      </div>
      <span className="universes-circle-name">{name}</span>
    </>
  );

  return (
    <div className="sources-circle-wrap">
      <Link
        href={sourceHref}
        className="universes-circle"
        title={`${name} — посты из источника`}
      >
        {circleContent}
      </Link>
      {canEdit && onToggle && (
        <div className="sources-circle-actions">
          <label className="sources-circle-toggle" title={enabled ? 'Отключить' : 'Включить'} onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onToggle(id, e.target.checked)}
              className="sources-circle-checkbox"
            />
            <span className="sources-circle-toggle-label">
              {enabled ? <i className="fa-solid fa-check" /> : <i className="fa-solid fa-pause" />}
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
