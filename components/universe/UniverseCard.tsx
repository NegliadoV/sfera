'use client';

import Link from 'next/link';
import { SferaSphereIcon } from '@/components/SferaSphereIcon';

export interface UniverseCardProps {
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sphereColor?: string | null;
  href?: string;
  className?: string;
}

export function UniverseCard({
  slug,
  name,
  description,
  icon: _icon,
  sphereColor,
  href,
  className = '',
}: UniverseCardProps) {
  const linkHref = href || `/universes/${encodeURIComponent(slug)}`;

  return (
    <Link
      href={linkHref}
      className={`universes-circle ${className}`}
      title={description || name}
    >
      <div className="universes-circle-logo">
        <SferaSphereIcon size="md" color={sphereColor} />
      </div>
      <span className="universes-circle-name">{name}</span>
    </Link>
  );
}
