'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SubscribePaywall({
  universe,
  expired = false,
}: {
  universe: { id: string; name: string; slug: string; monthlyPrice: number | null };
  expired?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/universes/${encodeURIComponent(universe.slug)}/subscribe`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.confirmationUrl) {
          window.location.href = data.confirmationUrl;
        } else {
          setError('Ссылка на оплату не получена. Попробуйте еще раз.');
          setLoading(false);
        }
      } else {
        if (res.status === 401) {
          window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(pathname || '/')}`;
        } else {
          setError('Не удалось инициировать оплату.');
        }
        setLoading(false);
      }
    } catch (e) {
      setError('Ошибка сети. Попробуйте еще раз.');
      setLoading(false);
    }
  };

  return (
    <div className="platform-page" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
      <div className="platform-card" style={{ maxWidth: 480, textAlign: 'center', padding: '40px 24px' }}>
        <i className="fa-solid fa-lock" style={{ fontSize: '3rem', color: 'var(--accent-primary)', marginBottom: 24 }} />
        <h1 className="platform-hero-title" style={{ fontSize: '1.75rem', marginBottom: 16 }}>
          {expired ? 'Срок подписки истёк' : 'Сфера является закрытой'}
        </h1>
        <p className="platform-card-desc" style={{ marginBottom: 24 }}>
          {expired
            ? `Сфера «${universe.name}» доступна только по активной подписке. Ваша подписка закончилась.`
            : `Сфера «${universe.name}» работает по платной подписке. Оплатите доступ, чтобы просматривать материалы и участвовать в обсуждениях.`}
        </p>

        <div style={{ background: 'var(--bg-accent)', padding: '16px', borderRadius: 12, marginBottom: 24 }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Стоимость доступа</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {universe.monthlyPrice ?? 0} <span style={{ fontSize: '1.2rem' }}>RUB / мес.</span>
          </div>
        </div>

        {error && (
          <p style={{ color: 'var(--accent-red, #e53e3e)', marginBottom: 16, fontSize: '0.9rem' }}>{error}</p>
        )}

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="platform-btn platform-btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: '1.1rem' }}
        >
          {loading ? (
            <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }} /> Обработка...</>
          ) : (
            <>Перейти к оплате <i className="fa-solid fa-arrow-right" style={{ marginLeft: 8 }} /></>
          )}
        </button>

        <div style={{ marginTop: 24, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Оплата производится безопасно через систему ЮKassa.
        </div>
      </div>
    </div>
  );
}
