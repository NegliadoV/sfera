'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Universe {
  slug: string;
  name: string;
  icon: string | null;
  sphereColor: string | null;
  description: string | null;
}

export function OnboardingWizard({ universes }: { universes: Universe[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  function toggle(slug: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function handleFinish() {
    // Отслеживаем выбранные сферы
    if (selected.size > 0) {
      try {
        await fetch('/api/me/onboarding-track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slugs: Array.from(selected) }),
        });
      } catch {}
    }
    startTransition(() => {
      router.push('/explore');
    });
  }

  if (step === 1) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 20px' }}>
            🌐
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
            Добро пожаловать в Roominate!
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.7, maxWidth: 480, margin: '0 auto' }}>
            Выбери сферы по интересам — и мы персонализируем ленту специально для тебя.
            Можно выбрать несколько.
          </p>
        </div>

        {/* Прогресс */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 40 }}>
          {[1, 2].map(s => (
            <div key={s} style={{ height: 4, width: 60, borderRadius: 4, background: s <= step ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', transition: 'background .3s' }} />
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 40 }}>
          {universes.map(u => {
            const active = selected.has(u.slug);
            return (
              <button
                key={u.slug}
                onClick={() => toggle(u.slug)}
                style={{
                  background: active ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? 'rgba(37,99,235,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 16,
                  padding: '18px 14px',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  textAlign: 'center',
                  transition: 'all .2s',
                  transform: active ? 'scale(1.03)' : 'scale(1)',
                  boxShadow: active ? '0 0 16px rgba(37,99,235,0.2)' : 'none',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{u.icon ?? '🌐'}</div>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{u.name}</div>
                {active && (
                  <div style={{ marginTop: 8, color: '#60a5fa', fontSize: 18 }}>✓</div>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => setStep(2)}
            disabled={selected.size === 0}
            style={{
              background: selected.size >= 1 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.06)',
              color: selected.size >= 1 ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 12,
              padding: '12px 32px',
              fontWeight: 700,
              fontSize: 15,
              cursor: selected.size >= 1 ? 'pointer' : 'not-allowed',
              transition: 'all .2s',
            }}
          >
            Далее {selected.size > 0 && `(${selected.size} выбрано)`}
          </button>
          <button
            onClick={handleFinish}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', padding: '12px 16px' }}
          >
            Пропустить
          </button>
        </div>
      </div>
    );
  }

  // Шаг 2 — финал
  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 48 }}>
        {[1, 2].map(s => (
          <div key={s} style={{ height: 4, width: 60, borderRadius: 4, background: s <= step ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)' }} />
        ))}
      </div>

      <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
        Ты готов!
      </h1>
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
        Мы подписали тебя на <strong>{selected.size}</strong> {selected.size === 1 ? 'сферу' : selected.size < 5 ? 'сферы' : 'сфер'}.
        Лента будет персонализирована специально для тебя.
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 40 }}>
        В любой момент ты можешь изменить подписки в настройках.
      </p>

      <button
        onClick={handleFinish}
        disabled={isPending}
        style={{
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover))',
          color: '#fff',
          border: 'none',
          borderRadius: 14,
          padding: '14px 40px',
          fontWeight: 700,
          fontSize: 16,
          cursor: isPending ? 'wait' : 'pointer',
          boxShadow: '0 8px 24px rgba(37,99,235,0.3)',
          transition: 'transform .2s',
        }}
      >
        {isPending ? 'Переходим...' : 'Перейти в ленту →'}
      </button>
    </div>
  );
}
