import Link from 'next/link';

export const metadata = {
  title: 'О проекте | SFERA',
  description: 'Инструмент для мышления и осмысленного диалога.',
};

export default async function AboutPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (searchParams) await searchParams;
  return (
    <div className="platform-page">
      <div className="platform-breadcrumb mb-6">
        <Link href="/">SFERA</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>О проекте</span>
      </div>

      <h1 className="platform-hero-title mb-2">О проекте SFERA</h1>
      <p className="platform-hero-desc mb-10">
        Платформа для глубокого познания: тематические вселенные, структурированные дискуссии,
        комнаты синхронного просмотра и агрегация контента.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <section className="platform-card" id="principles">
          <div className="platform-card-title">
            <i className="fa-solid fa-lightbulb" aria-hidden />
            Принципы
          </div>
          <p className="platform-card-desc mb-0">
            Прозрачность алгоритмов, структурированный диалог вместо бесконечного скролла, цифровая
            гигиена и монетизация без рекламы.
          </p>
        </section>
        <section className="platform-card" id="monetization">
          <div className="platform-card-title">
            <i className="fa-solid fa-coins" aria-hidden />
            Монетизация
          </div>
          <p className="platform-card-desc mb-0">
            Подписка и платные возможности (премиум-вселенные, платные сессии с экспертами). Рекламы
            в продукте нет.
          </p>
        </section>
      </div>

      <section className="platform-card mb-10" id="contacts">
        <div className="platform-card-title">
          <i className="fa-solid fa-envelope" aria-hidden />
          Контакты
        </div>
        <p className="platform-card-desc mb-0">
          По вопросам сотрудничества и обратной связи — через репозиторий проекта или указанные в
          нём контакты.
        </p>
      </section>

      <Link href="/" className="platform-btn platform-btn-primary no-underline">
        <i className="fa-solid fa-compass" aria-hidden />
        Перейти к вселенным
      </Link>
    </div>
  );
}
