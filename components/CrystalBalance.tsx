'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export function CrystalBalance() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    
    let mounted = true;
    
    const fetchBalance = () => {
      fetch('/api/me/crystals', { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          if (mounted && typeof data.balance === 'number') {
            setBalance(data.balance);
          }
        })
        .catch(() => {});
    };

    fetchBalance();
    
    // Optionally listen to custom events if crystals are updated elsewhere
    const handleCrystalsUpdate = () => { fetchBalance(); };
    window.addEventListener('crystals-balance-refresh', handleCrystalsUpdate);

    return () => {
      mounted = false;
      window.removeEventListener('crystals-balance-refresh', handleCrystalsUpdate);
    };
  }, [session]);

  if (balance === null) return null;

  return (
    <div
      className="glass-icon-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.8rem]"
      style={{
        color: '#0fbdf8',
        fontWeight: 600,
        backgroundColor: 'color-mix(in srgb, #0fbdf8 15%, transparent)',
        border: '1px solid color-mix(in srgb, #0fbdf8 30%, transparent)',
        cursor: 'default',
      }}
      title="Ваш баланс кристаллов"
    >
      <i className="fa-solid fa-gem text-[0.8rem]" style={{ filter: 'drop-shadow(0 0 4px color-mix(in srgb, #0fbdf8 50%, transparent))' }}></i>
      {balance.toLocaleString('ru-RU')}
    </div>
  );
}
