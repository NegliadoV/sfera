import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Авторские права и DMCA | Roominate',
  description: 'Политика защиты авторских прав. Процедура удаления контента для правообладателей.',
  robots: 'index, follow',
};

export default async function DmcaPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (searchParams) await searchParams;

  return (
    <div className="platform-page">
      <div className="platform-breadcrumb mb-6">
        <Link href="/">Roominate</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>Авторские права</span>
      </div>

      <h1 className="platform-hero-title mb-2">
        Авторские права и DMCA
      </h1>
      <p className="platform-hero-desc mb-10">
        Roominate — информационный агрегатор и посредник. Мы уважаем права авторов
        и оперативно реагируем на запросы об удалении контента.
      </p>

      {/* Принципы агрегации */}
      <section className="platform-card mb-6" id="principles">
        <div className="platform-card-title">
          <i className="fa-solid fa-scale-balanced" aria-hidden />
          Как мы работаем с контентом
        </div>
        <div className="platform-card-desc" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p>
            <strong>Цитирование, а не копирование.</strong> Мы показываем заголовок, краткий фрагмент
            (превью), обложку и прямую ссылку на первоисточник с указанием автора/канала. Полный текст
            материалов у нас не хранится.
          </p>
          <p>
            <strong>RSS-ленты.</strong> Мы используем открытые RSS-каналы, специально созданные для
            синдикации. Каждый материал сопровождается ссылкой на оригинал. Если вы хотите отозвать
            разрешение на агрегацию вашей ленты — напишите нам.
          </p>
          <p>
            <strong>Telegram-каналы.</strong> Мы агрегируем только публичные посты через официальный
            Telegram API. Медиафайлы не загружаются на наши серверы — мы ссылаемся на оригинальный пост.
          </p>
          <p>
            <strong>Атрибуция.</strong> Каждая карточка контента содержит имя автора/источника и прямую
            ссылку «Читать в источнике». Убрать ссылку на источник технически невозможно.
          </p>
        </div>
      </section>

      {/* Уведомление о нарушении */}
      <section className="platform-card mb-6" id="takedown">
        <div className="platform-card-title">
          <i className="fa-solid fa-envelope-open-text" aria-hidden />
          Процедура удаления (Notice & Takedown)
        </div>
        <div className="platform-card-desc" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p>
            Если вы являетесь правообладателем и считаете, что ваши материалы размещены без разрешения,
            направьте нам запрос на удаление. Мы рассмотрим обращение и удалим контент в течение
            <strong> 24–48 часов</strong>.
          </p>
          <div
            style={{
              background: 'var(--studio-panel-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              padding: '16px 20px',
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: 8 }}>
              <i className="fa-solid fa-at" aria-hidden /> Контакт для обращений правообладателей:
            </p>
            <a
              href="mailto:support@roominate.rest?subject=DMCA%20Takedown%20Request"
              style={{ fontSize: '1.1rem', color: 'var(--accent-primary)', fontWeight: 600 }}
            >
              support@roominate.rest
            </a>
            <p style={{ marginTop: 8, fontSize: '0.85rem', opacity: 0.7 }}>
              Тема письма: DMCA Takedown Request
            </p>
          </div>
          <p style={{ fontSize: '0.9rem' }}>
            В запросе укажите: URL материала на нашем сайте, оригинальный URL вашего материала,
            ваши контактные данные и описание нарушения. Согласно DMCA (США), Директиве об авторском
            праве (ЕС) и ст. 1253.1 ГК РФ, платформа-посредник освобождается от ответственности при
            оперативном удалении контента по обоснованному запросу.
          </p>
        </div>
      </section>

      {/* Правовая основа */}
      <section className="platform-card mb-10" id="legal-basis">
        <div className="platform-card-title">
          <i className="fa-solid fa-gavel" aria-hidden />
          Правовая основа
        </div>
        <div className="platform-card-desc" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p>Наша деятельность соответствует принципу <em>добросовестного использования</em> (Fair Use)
            и нормам об информационных посредниках:</p>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li><strong>США:</strong> Digital Millennium Copyright Act (DMCA), Safe Harbor (17 U.S.C. § 512)</li>
            <li><strong>ЕС:</strong> Директива об авторском праве 2019/790, ст. 17</li>
            <li><strong>Россия:</strong> Ст. 1253.1 ГК РФ (информационный посредник)</li>
          </ul>
        </div>
      </section>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/terms" className="platform-btn platform-btn-secondary no-underline">
          <i className="fa-solid fa-file-contract" aria-hidden />
          Условия использования
        </Link>
        <Link href="/" className="platform-btn platform-btn-primary no-underline">
          <i className="fa-solid fa-compass" aria-hidden />
          На главную
        </Link>
      </div>
    </div>
  );
}
