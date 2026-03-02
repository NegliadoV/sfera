'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PinUnpinButtonProps {
  contentId: string;
  pinned: boolean;
  className?: string;
}

export function PinUnpinButton({ contentId, pinned, className }: PinUnpinButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/content/${contentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !pinned }),
        credentials: 'include',
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={className ?? 'platform-btn platform-btn-sm no-underline'}
    >
      {loading ? '…' : pinned ? 'Открепить' : 'Закрепить'}
    </button>
  );
}
