import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-16 md:py-24 text-center page-padding-mobile">
      <div
        className="inline-flex items-baseline gap-4 mb-6"
        style={{ color: 'var(--text-primary)' }}
      >
        <span
          className="text-6xl md:text-8xl font-bold tabular-nums"
          style={{
            background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-blue))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          404
        </span>
        <span className="text-xl md:text-2xl font-medium hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>
          Страница не найдена
        </span>
      </div>
      <p className="text-lg mb-2" style={{ color: 'var(--text-secondary)' }}>
        Такой страницы в Ноосфере нет.
      </p>
      <p className="text-sm mb-10" style={{ color: 'var(--text-secondary)' }}>
        Возможно, ссылка устарела или материал был перемещён.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className="neon-block inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-lg)] font-medium no-underline transition-all duration-200 hover:opacity-90"
          style={{
            backgroundColor: 'var(--bg-accent)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          }}
        >
          На главную
        </Link>
        <Link
          href="/"
          className="neon-block inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-lg)] font-semibold text-white no-underline transition-all duration-300 hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-blue))',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          К вселенным
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
