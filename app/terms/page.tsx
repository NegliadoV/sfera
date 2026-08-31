import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Условия использования | Roominate',
  description: 'Условия использования платформы Roominate. Правила для пользователей и агрегаторов.',
  robots: 'index, follow',
};

export default async function TermsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (searchParams) await searchParams;

  const lastUpdated = '31 августа 2025 г.';

  return (
    <div className="platform-page">
      <div className="platform-breadcrumb mb-6">
        <Link href="/">Roominate</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>Условия использования</span>
      </div>

      <h1 className="platform-hero-title mb-2">Условия использования</h1>
      <p className="platform-hero-desc mb-10">
        Последнее обновление: {lastUpdated}. Используя Roominate, вы соглашаетесь с настоящими условиями.
      </p>

      <section className="platform-card mb-6" id="platform">
        <div className="platform-card-title">
          <i className="fa-solid fa-cube" aria-hidden />
          1. О платформе
        </div>
        <div className="platform-card-desc">
          <p>
            Roominate — информационный агрегатор и платформа для структурированного диалога. Мы
            предоставляем инструменты для создания тематических вселенных, агрегации контента из
            публичных источников (RSS, Telegram) и совместного обсуждения материалов.
          </p>
        </div>
      </section>

      <section className="platform-card mb-6" id="user-responsibility">
        <div className="platform-card-title">
          <i className="fa-solid fa-user-shield" aria-hidden />
          2. Ответственность пользователей за внешние источники
        </div>
        <div className="platform-card-desc" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p>
            Пользователи, которые создают вселенные и добавляют внешние RSS-ленты, Telegram-каналы
            или иные источники, <strong>самостоятельно несут ответственность</strong> за соблюдение
            авторских прав и условий использования подключаемых ресурсов.
          </p>
          <p>Запрещается добавлять источники, если:</p>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Правообладатель явно запрещает агрегацию (в Terms of Service или robots.txt источника);</li>
            <li>Контент закрыт paywallом или требует авторизации;</li>
            <li>Источник содержит материалы, нарушающие законодательство.</li>
          </ul>
          <p>
            Roominate действует как <strong>информационный посредник</strong>. При получении
            обоснованной жалобы правообладателя мы удаляем контент в течение 24–48 часов (процедура
            DMCA Notice & Takedown).
          </p>
        </div>
      </section>

      <section className="platform-card mb-6" id="aggregation">
        <div className="platform-card-title">
          <i className="fa-solid fa-rss" aria-hidden />
          3. Правила агрегации контента
        </div>
        <div className="platform-card-desc" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p>Платформа отображает <strong>анонсы</strong> материалов — заголовок, краткий фрагмент,
            обложку и ссылку на оригинал. Полный текст внешних материалов не копируется.</p>
          <p>Каждая карточка агрегированного контента содержит:</p>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Название источника/канала;</li>
            <li>Имя автора (если доступно);</li>
            <li>Прямую ссылку «Читать в источнике», открывающую оригинальный материал.</li>
          </ul>
        </div>
      </section>

      <section className="platform-card mb-6" id="user-content">
        <div className="platform-card-title">
          <i className="fa-solid fa-pen" aria-hidden />
          4. Пользовательский контент
        </div>
        <div className="platform-card-desc" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p>
            Публикуя материалы на платформе, вы подтверждаете, что обладаете необходимыми правами
            на этот контент и предоставляете Roominate безвозмездную лицензию на его отображение
            в рамках платформы.
          </p>
          <p>Запрещается публиковать:</p>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Материалы, нарушающие авторские права третьих лиц;</li>
            <li>Незаконный, оскорбительный или вводящий в заблуждение контент;</li>
            <li>Спам, вредоносные ссылки и фишинг.</li>
          </ul>
        </div>
      </section>

      <section className="platform-card mb-6" id="limitation">
        <div className="platform-card-title">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden />
          5. Ограничение ответственности
        </div>
        <div className="platform-card-desc">
          <p>
            Платформа предоставляется «как есть». Roominate не несёт ответственности за содержание
            внешних источников, добавленных пользователями, а также за возможный ущерб от использования
            платформы. Мы не гарантируем бесперебойную работу сервиса.
          </p>
        </div>
      </section>

      <section className="platform-card mb-10" id="contacts">
        <div className="platform-card-title">
          <i className="fa-solid fa-envelope" aria-hidden />
          6. Контакты
        </div>
        <div className="platform-card-desc" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p>По вопросам условий использования и нарушений авторских прав:</p>
          <a
            href="mailto:support@roominate.rest"
            style={{ color: 'var(--accent-primary)', fontWeight: 600 }}
          >
            support@roominate.rest
          </a>
        </div>
      </section>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/dmca" className="platform-btn platform-btn-secondary no-underline">
          <i className="fa-solid fa-copyright" aria-hidden />
          DMCA / Авторские права
        </Link>
        <Link href="/" className="platform-btn platform-btn-primary no-underline">
          <i className="fa-solid fa-compass" aria-hidden />
          На главную
        </Link>
      </div>
    </div>
  );
}
