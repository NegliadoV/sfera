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

const STEPS = [
  { id: 1, label: 'Привет' },
  { id: 2, label: 'Интересы' },
  { id: 3, label: 'Готово' },
];

const FEATURES = [
  { icon: 'fa-shapes', color: '#60a5fa', label: 'Тематические комнаты', desc: 'Агрегируй контент по темам' },
  { icon: 'fa-brain', color: '#fb923c', label: 'Ментальные карты', desc: 'Структурируй свои мысли' },
  { icon: 'fa-bolt', color: '#c084fc', label: 'Шортсы', desc: 'Познавательные видео за 60 сек' },
  { icon: 'fa-microphone', color: '#4ade80', label: 'Живые комнаты', desc: 'Аудио-дискуссии в реальном времени' },
];

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
      router.push('/explore?welcome=1');
    });
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #090a0f 0%, #0d1220 50%, #090a0f 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '48px 24px 80px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient glow effects */}
      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: '50vw', height: '50vh', borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-10%', width: '40vw', height: '40vh', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em', background: 'linear-gradient(130deg,#fff,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Roominate
        </span>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 48 }}>
        {STEPS.map((s, i) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: step >= s.id ? 'var(--accent-primary, #2563eb)' : 'rgba(255,255,255,0.06)',
              border: `1.5px solid ${step >= s.id ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
              color: step >= s.id ? '#fff' : 'var(--text-muted)',
              transition: 'all .3s',
              boxShadow: step === s.id ? '0 0 16px rgba(37,99,235,0.4)' : 'none',
            }}>
              {step > s.id ? <i className="fa-solid fa-check" style={{ fontSize: 11 }} /> : s.id}
            </div>
            <span style={{ fontSize: 12, color: step >= s.id ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: step === s.id ? 600 : 400, transition: 'color .3s' }}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div style={{ width: 32, height: 1.5, background: step > s.id ? 'var(--accent-primary, #2563eb)' : 'rgba(255,255,255,0.08)', borderRadius: 2, marginLeft: 4, transition: 'background .3s' }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: 680 }}>

        {/* ── STEP 1: Welcome ─────────────────────────────────────── */}
        {step === 1 && (
          <div style={{ textAlign: 'center', animation: 'ob-fadein .4s ease both' }}>
            <style>{`
              @keyframes ob-fadein { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
              @keyframes ob-icon-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
            `}</style>

            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(37,99,235,0.15)', border: '1.5px solid rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 28px', animation: 'ob-icon-pulse 3s ease-in-out infinite' }}>
              🌐
            </div>

            <h1 style={{ fontSize: 'clamp(24px,5vw,36px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 14, background: 'linear-gradient(135deg, #fff 30%, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Добро пожаловать в Roominate!
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 17, lineHeight: 1.65, maxWidth: 480, margin: '0 auto 48px' }}>
              Платформа, где знания превращаются в сообщества. Темы, мысли, люди — всё на своём месте.
            </p>

            {/* Feature grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 48, textAlign: 'left' }}>
              {FEATURES.map(f => (
                <div key={f.icon} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '16px 14px', transition: 'border-color .2s' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <i className={`fa-solid ${f.icon}`} style={{ color: f.color, fontSize: 16 }} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{f.label}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 48px', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 8px 28px rgba(37,99,235,0.35)', transition: 'transform .2s, box-shadow .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              Начать → Выбрать интересы
            </button>

            <div style={{ marginTop: 16 }}>
              <button onClick={handleFinish} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', padding: '8px' }}>
                Пропустить и перейти в ленту
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Pick interests ───────────────────────────────── */}
        {step === 2 && (
          <div style={{ animation: 'ob-fadein .4s ease both' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h2 style={{ fontSize: 'clamp(20px,4vw,30px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10 }}>
                Выбери минимум 3 комнаты по интересам
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                Мы персонализируем ленту специально под тебя. Всегда можно изменить в настройках.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: 10, marginBottom: 36 }}>
              {universes.map(u => {
                const active = selected.has(u.slug);
                const color = u.sphereColor ?? '#60a5fa';
                return (
                  <button
                    key={u.slug}
                    onClick={() => toggle(u.slug)}
                    style={{
                      background: active ? `${color}18` : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${active ? color + '60' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 16,
                      padding: '16px 12px',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      textAlign: 'center',
                      transition: 'all .2s',
                      transform: active ? 'scale(1.03)' : 'scale(1)',
                      boxShadow: active ? `0 4px 18px ${color}30` : 'none',
                      position: 'relative',
                    }}
                  >
                    {active && (
                      <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fa-solid fa-check" style={{ fontSize: 9, color: '#fff' }} />
                      </div>
                    )}
                    <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 22 }}>
                      {u.icon?.startsWith('fa-')
                        ? <i className={`fa-solid ${u.icon}`} style={{ color }} />
                        : <span style={{ fontSize: 26 }}>{u.icon ?? '🌐'}</span>
                      }
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3 }}>{u.name}</div>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setStep(1)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', borderRadius: 12, padding: '12px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              >
                ← Назад
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={selected.size < 1}
                style={{
                  background: selected.size >= 1 ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'rgba(255,255,255,0.06)',
                  color: selected.size >= 1 ? '#fff' : 'var(--text-muted)',
                  border: 'none', borderRadius: 12, padding: '12px 32px', fontWeight: 700, fontSize: 15,
                  cursor: selected.size >= 1 ? 'pointer' : 'not-allowed',
                  boxShadow: selected.size >= 1 ? '0 8px 24px rgba(37,99,235,0.3)' : 'none',
                  transition: 'all .2s',
                }}
              >
                Далее {selected.size > 0 && `(${selected.size} выбрано)`}
              </button>
              <button onClick={handleFinish} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', padding: '12px 8px' }}>
                Пропустить
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Let's go ────────────────────────────────────── */}
        {step === 3 && (
          <div style={{ textAlign: 'center', animation: 'ob-fadein .4s ease both' }}>
            <div style={{ fontSize: 72, marginBottom: 24, filter: 'drop-shadow(0 0 24px rgba(37,99,235,0.4))' }}>🎉</div>
            <h1 style={{ fontSize: 'clamp(22px,5vw,34px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 14, background: 'linear-gradient(135deg, #fff 30%, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Всё готово!
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.65, maxWidth: 440, margin: '0 auto 12px' }}>
              Ты подписался на <strong style={{ color: '#fff' }}>{selected.size}</strong> {selected.size < 5 ? (selected.size === 1 ? 'комнату' : 'комнаты') : 'комнат'}.
              Твоя лента уже настраивается под тебя.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 40 }}>
              Подписки можно изменить в любой момент в настройках.
            </p>

            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 420, margin: '0 auto 36px', textAlign: 'left' }}>
              {[
                { icon: 'fa-newspaper', color: '#60a5fa', label: 'Перейти в ленту', sub: 'Твой персональный контент' },
                { icon: 'fa-brain', color: '#fb923c', label: 'Создать карту', sub: 'Структурируй мысли' },
              ].map(a => (
                <div key={a.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 12px' }}>
                  <i className={`fa-solid ${a.icon}`} style={{ color: a.color, fontSize: 18, marginBottom: 8, display: 'block' }} />
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{a.sub}</div>
                </div>
              ))}
            </div>

            <button
              onClick={handleFinish}
              disabled={isPending}
              style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#fff', border: 'none', borderRadius: 14,
                padding: '16px 56px', fontWeight: 700, fontSize: 17,
                cursor: isPending ? 'wait' : 'pointer',
                boxShadow: '0 8px 32px rgba(37,99,235,0.4)',
                transition: 'transform .2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              {isPending ? 'Загружаем...' : 'Войти в ленту →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
