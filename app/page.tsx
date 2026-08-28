import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import Link from 'next/link';
import { db, universes, content, user } from '@/lib/db';
import { desc, sql } from 'drizzle-orm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roominate — платформа для умных дискуссий',
  description: 'Создавай сферы по интересам, обсуждай идеи, смотри шортсы и участвуй в живых комнатах.',
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Авторизованных — сразу в приложение
  let session = null;
  try {
    session = await auth();
  } catch {}
  if (session?.user) redirect('/explore');


  // Загружаем публичные данные для превью
  let previewUniverses: { name: string; slug: string; icon: string | null; sphereColor: string | null }[] = [];
  let stats = { universes: 0, posts: 0, users: 0 };

  try {
    previewUniverses = await db
      .select({ name: universes.name, slug: universes.slug, icon: universes.icon, sphereColor: universes.sphereColor })
      .from(universes)
      .orderBy(desc(universes.updatedAt))
      .limit(8);

    const [uCount] = await db.select({ c: sql<number>`count(*)::int` }).from(universes);
    const [pCount] = await db.select({ c: sql<number>`count(*)::int` }).from(content);
    const [uuCount] = await db.select({ c: sql<number>`count(*)::int` }).from(user);
    stats = { universes: uCount?.c ?? 0, posts: pCount?.c ?? 0, users: uuCount?.c ?? 0 };
  } catch {}

  const features = [
    {
      icon: 'fa-solid fa-globe',
      color: '#3b82f6',
      title: 'Сферы по интересам',
      desc: 'Создавай тематические пространства — от философии до квантовой физики. Агрегируй контент из Telegram, RSS и собственных публикаций.',
    },
    {
      icon: 'fa-solid fa-bolt',
      color: '#a855f7',
      title: 'Шортсы',
      desc: 'Короткие познавательные видео в вертикальном формате. Учись и вдохновляйся за 60 секунд.',
    },
    {
      icon: 'fa-solid fa-microphone',
      color: '#22c55e',
      title: 'Живые комнаты',
      desc: 'Аудио и видео-комнаты с тематическими дискуссиями в реальном времени. Будь частью разговора.',
    },
    {
      icon: 'fa-solid fa-brain',
      color: '#f97316',
      title: 'Ментальные карты',
      desc: 'Визуализируй связи между идеями, тезисами и источниками. Структурируй знания.',
    },
  ];

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #090a0f 0%, #0f1320 50%, #090a0f 100%)', color: '#e4e6e9', fontFamily: 'var(--font-brand, system-ui, sans-serif)' }}>

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(9,10,15,0.8)', backdropFilter: 'blur(20px)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.03em', background: 'linear-gradient(130deg,#fff,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Roominate
        </span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/auth/signin" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textDecoration: 'none', padding: '6px 14px', borderRadius: 8, transition: 'color .2s' }}>
            Войти
          </Link>
          <Link href="/auth/register" style={{ background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none', padding: '8px 18px', borderRadius: 10, transition: 'background .2s' }}>
            Начать бесплатно
          </Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section style={{ textAlign: 'center', padding: '100px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Фоновые блобы */}
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '20%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 20, padding: '6px 16px', fontSize: 13, color: '#60a5fa', marginBottom: 32 }}>
          <i className="fa-solid fa-sparkles" />
          Платформа для умных дискуссий
        </div>

        <h1 style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: 24, maxWidth: 800, margin: '0 auto 24px' }}>
          Думай глубже.{' '}
          <span style={{ background: 'linear-gradient(130deg, #3b82f6, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Обсуждай умнее.
          </span>
        </h1>

        <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'rgba(255,255,255,0.5)', maxWidth: 560, margin: '0 auto 48px', lineHeight: 1.7 }}>
          Roominate — пространство для тех, кто ценит качественный контент. Создавай сферы, участвуй в дискуссиях, смотри шортсы и общайся в живых комнатах.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', textDecoration: 'none', padding: '14px 32px', borderRadius: 14, fontWeight: 700, fontSize: 16, boxShadow: '0 8px 32px rgba(37,99,235,0.35)', transition: 'transform .2s' }}>
            <i className="fa-solid fa-rocket" />
            Создать аккаунт
          </Link>
          <Link href="/auth/signin" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', textDecoration: 'none', padding: '14px 32px', borderRadius: 14, fontWeight: 600, fontSize: 16, transition: 'background .2s' }}>
            Войти
          </Link>
        </div>

        {/* Статистика */}
        {(stats.users > 0 || stats.posts > 0) && (
          <div style={{ display: 'flex', gap: 48, justifyContent: 'center', marginTop: 64, flexWrap: 'wrap' }}>
            {[
              { label: 'пользователей', val: stats.users },
              { label: 'публикаций', val: stats.posts },
              { label: 'сфер', val: stats.universes },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
                  {s.val > 1000 ? `${(s.val / 1000).toFixed(1)}k` : s.val}+
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
          Всё что нужно для умного досуга
        </h2>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', marginBottom: 56, fontSize: 16 }}>
          Четыре мощных инструмента в одном приложении
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {features.map((f) => (
            <div key={f.title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '32px 28px', transition: 'border-color .3s, transform .3s', cursor: 'default' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: `${f.color}20`, border: `1px solid ${f.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, fontSize: 22, color: f.color }}>
                <i className={f.icon} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 10, letterSpacing: '-0.02em' }}>{f.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── СФЕРЫ ───────────────────────────────────────────────────── */}
      {previewUniverses.length > 0 && (
        <section style={{ padding: '40px 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
            Популярные сферы
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 36, fontSize: 15 }}>Присоединяйся к сообществам по интересам</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {previewUniverses.map((u) => (
              <Link key={u.slug} href="/auth/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 50, padding: '10px 18px', textDecoration: 'none', color: '#e4e6e9', fontSize: 14, fontWeight: 500, transition: 'background .2s, border-color .2s' }}>
                <span style={{ fontSize: 20 }}>{u.icon ?? '🌐'}</span>
                {u.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '60px 24px 100px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 28, padding: '56px 40px' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
            Готов начать?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 36, fontSize: 15, lineHeight: 1.7 }}>
            Регистрация бесплатна и занимает меньше минуты. Никаких алгоритмов зависимости — только качественный контент.
          </p>
          <Link href="/auth/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', textDecoration: 'none', padding: '16px 40px', borderRadius: 14, fontWeight: 700, fontSize: 17, boxShadow: '0 8px 32px rgba(37,99,235,0.4)' }}>
            <i className="fa-solid fa-rocket" />
            Присоединиться бесплатно
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
        © {new Date().getFullYear()} Roominate. Сделано с ❤️ для любопытных умов.
      </footer>
    </div>
  );
}
