import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Политика конфиденциальности | Roominate',
  description: 'Политика конфиденциальности и порядок обработки и удаления данных пользователей платформы Roominate.',
  robots: 'index, follow',
};

export default async function PrivacyPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (searchParams) await searchParams;

  const lastUpdated = '9 сентября 2026 г.';

  return (
    <div className="platform-page">
      <div className="platform-breadcrumb mb-6">
        <Link href="/">Roominate</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>Политика конфиденциальности</span>
      </div>

      <h1 className="platform-hero-title mb-2">Политика конфиденциальности</h1>
      <p className="platform-hero-desc mb-10">
        Последнее обновление: {lastUpdated}. В настоящей Политике описывается, как Roominate собирает, использует и защищает вашу личную информацию, а также порядок удаления данных.
      </p>

      <section className="platform-card mb-6" id="collection">
        <div className="platform-card-title">
          <i className="fa-solid fa-database" aria-hidden />
          1. Какие данные мы собираем
        </div>
        <div className="platform-card-desc" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p>При использовании Roominate мы можем получать следующие данные:</p>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li><strong>Данные учетной записи:</strong> имя, адрес электронной почты, аватар профиля.</li>
            <li><strong>Данные авторизации через третьих лиц (OAuth):</strong> при входе через Google, GitHub или Facebook мы получаем базовый идентификатор пользователя, имя, email и публичное изображение профиля в соответствии с разрешениями, предоставленными вами сервису.</li>
            <li><strong>Пользовательский контент:</strong> сообщения, комментарии, созданные сферы, ментальные карты и публикации.</li>
            <li><strong>Технические данные:</strong> файлы cookie для поддержания сессии авторизации и языковых настроек.</li>
          </ul>
        </div>
      </section>

      <section className="platform-card mb-6" id="usage">
        <div className="platform-card-title">
          <i className="fa-solid fa-gear" aria-hidden />
          2. Использование данных
        </div>
        <div className="platform-card-desc" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p>Мы используем собранные данные исключительно для следующих целей:</p>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Обеспечение функционирования сервиса, комнат обсуждений и персонального профиля;</li>
            <li>Аутентификация и защита вашей учетной записи от несанкционированного доступа;</li>
            <li>Предоставление технической поддержки и уведомлений о событиях платформы.</li>
          </ul>
          <p>Мы <strong>не продаем</strong> и не передаем ваши персональные данные третьим лицам в рекламных целях.</p>
        </div>
      </section>

      <section className="platform-card mb-6" id="data-deletion" style={{ borderColor: 'rgba(59, 130, 246, 0.4)' }}>
        <div className="platform-card-title" style={{ color: '#60a5fa' }}>
          <i className="fa-solid fa-user-xmark" aria-hidden />
          3. Удаление данных пользователей (Data Deletion Instructions)
        </div>
        <div className="platform-card-desc" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p>
            В соответствии с регламентами платформ (включая требования Facebook / Meta Platform Terms) пользователи имеют право в любой момент запросить полное удаление своих данных, связанных с приложением Roominate.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 8, color: '#fff' }}>
              Инструкция по удалению учетной записи и связанных данных:
            </h3>
            <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>
                <strong>Через настройки профиля:</strong> Войдите в свой аккаунт, перейдите в раздел «Настройки» и воспользуйтесь опцией запроса на удаление профиля.
              </li>
              <li>
                <strong>По прямому запросу на email:</strong> Отправьте письмо на наш адрес поддержки <a href="mailto:support@roominate.rest" style={{ color: '#60a5fa', textDecoration: 'underline' }}>support@roominate.rest</a> с темой <em>«Удаление персональных данных / Data Deletion Request»</em>, указав email вашей учетной записи Roominate.
              </li>
              <li>
                <strong>Для пользователей, авторизованных через Facebook:</strong> Вы также можете перейти в настройки своего аккаунта Facebook в раздел <em>«Настройки и конфиденциальность» → «Приложения и сайты»</em>, найти <strong>Roominate</strong>, нажать «Удалить» и воспользоваться кнопкой просмотра статуса запроса на удаление данных.
              </li>
            </ol>
          </div>
          <p>
            После получения запроса все ваши персональные данные (профиль, привязки OAuth, email, история сессий) будут безвозвратно удалены из базы данных в течение 30 дней.
          </p>
        </div>
      </section>

      <section className="platform-card mb-10" id="contacts">
        <div className="platform-card-title">
          <i className="fa-solid fa-envelope" aria-hidden />
          4. Контакты
        </div>
        <div className="platform-card-desc" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p>По любым вопросам конфиденциальности и удаления информации:</p>
          <a
            href="mailto:support@roominate.rest"
            style={{ color: 'var(--accent-primary)', fontWeight: 600 }}
          >
            support@roominate.rest
          </a>
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
