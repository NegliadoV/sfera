'use client';

import { useUniversePresence } from '@/components/useUniversePresence';

type Props = {
  slug: string;
  currentUser: { userId: string; userName: string | null } | null;
};

export function UniversePresenceBlock({ slug, currentUser }: Props) {
  const presenceUsers = useUniversePresence(slug, currentUser);

  if (presenceUsers.length === 0) return null;

  return (
    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
      Сейчас здесь: {presenceUsers.map((u) => u.userName ?? 'Участник').join(', ')}
    </p>
  );
}
