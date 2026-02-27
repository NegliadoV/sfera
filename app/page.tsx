import Link from 'next/link';
import { UniversesDemo } from '@/components/UniversesDemo';

export default async function HomePage(
  props: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
  }
) {
  const searchParams = await props.searchParams;
  if (searchParams) await searchParams;
  return (
    <div className="platform-page">
      <section className="text-center mb-14 md:mb-18">
        <h1 className="platform-hero-title">
          Платформа для глубокого познания
        </h1>
        <p className="platform-hero-desc mx-auto">
          SFERA — инструмент для мышления и осмысленного диалога. Помогаем строить понимание и
          находить единомышленников для глубокого обмена идеями.
        </p>
        <Link href="/" className="platform-btn platform-btn-primary no-underline">
          <i className="fa-solid fa-compass" aria-hidden />
          Исследовать сферы знаний
        </Link>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
        <ConceptCard
          icon="fa-globe"
          title="Контекстуальные «Сферы»"
          description="Создавайте или выбирайте тематические пространства. В каждой сфере — свои правила, модерация и типы контента."
          tags={['тематические пространства', 'целенаправленный контент']}
        />
        <ConceptCard
          icon="fa-comments"
          title="Двухуровневая система общения"
          description="Структурированные дискуссии вокруг контента и глубокое общение в виртуальных комнатах с тематическими раундами."
          tags={['структурированные дискуссии', 'виртуальные комнаты']}
        />
        <ConceptCard
          icon="fa-robot"
          title="Интеллектуальный агрегатор"
          description="Анализ контента по выбранной теме. Алгоритм помогает строить картину знания, прозрачные настройки отбора."
          tags={['анализ контента', 'прозрачные алгоритмы']}
        />
      </section>

      <UniversesDemo />
    </div>
  );
}

function ConceptCard({
  icon,
  title,
  description,
  tags,
}: {
  icon: string;
  title: string;
  description: string;
  tags: string[];
}) {
  return (
    <article className="platform-card">
      <div className="platform-card-title">
        <i className={`fa-solid ${icon}`} aria-hidden />
        {title}
      </div>
      <p className="platform-card-desc mb-4">{description}</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="platform-tag">
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
