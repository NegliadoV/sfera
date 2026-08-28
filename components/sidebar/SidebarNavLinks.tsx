'use client';

import Link from 'next/link';
import type { Session } from 'next-auth';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { CrystalBalance } from '@/components/CrystalBalance';

interface SidebarNavLinksProps {
  session?: Session | null;
  pathname: string;
  spheresOpen: boolean;
  setSpheresOpen: React.Dispatch<React.SetStateAction<boolean>>;
  contactsOpen: boolean;
  setContactsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  collectionOpen: boolean;
  setCollectionOpen: React.Dispatch<React.SetStateAction<boolean>>;
  unreadCount: number;
  universeSlug: string | null;
  setMiniAppOpen: (open: boolean) => void;
}

export function SidebarNavLinks({
  session,
  pathname,
  spheresOpen,
  setSpheresOpen,
  contactsOpen,
  setContactsOpen,
  collectionOpen,
  setCollectionOpen,
  unreadCount,
  universeSlug,
  setMiniAppOpen,
}: SidebarNavLinksProps) {
  const isContentSection = Boolean(universeSlug);

  return (
    <aside
      className={`sidebar-nav-section ${(contactsOpen || spheresOpen || collectionOpen) ? 'hidden md:flex' : 'flex'}`}
      style={{
        width: 240,
        minWidth: 240,
        flexShrink: 0,
        padding: '16px 14px',
        flexDirection: 'column',
        borderRight: (contactsOpen || spheresOpen || collectionOpen) ? '1px solid var(--studio-panel-border)' : 'none',
      }}
    >
      {session?.user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <CrystalBalance />
          <NotificationsDropdown />
          <Link
            href="/me"
            className="glass-icon-btn header-btn-primary header-avatar"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: 14,
              overflow: 'hidden',
              textDecoration: 'none',
              flexShrink: 0,
            }}
            title={session.user.name ?? session.user.email ?? 'Личный кабинет'}
          >
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt=""
                width={36}
                height={36}
                style={{ borderRadius: 10, objectFit: 'cover' }}
              />
            ) : (
              <span>
                {(session.user.name ?? session.user.email ?? '?').slice(0, 1).toUpperCase()}
              </span>
            )}
          </Link>
        </div>
      )}
      <nav style={{ flex: 1, overflowY: 'auto' }}>
        <div className="sidebar-nav-label">Комнаты</div>
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => {
              setSpheresOpen((v) => !v);
              setContactsOpen(false);
              setCollectionOpen(false);
            }}
            className={`sidebar-nav-link ${spheresOpen ? 'active' : ''}`}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
              font: 'inherit',
              color: 'inherit',
              padding: 0,
              textAlign: 'left',
            }}
          >
            <i className="fas fa-shapes" />
            {universeSlug ? '← Выбор комнаты' : 'Комнаты'}
            <i className={`fas fa-chevron-${spheresOpen ? 'left' : 'right'}`} style={{ fontSize: '0.75rem', marginLeft: 'auto' }} />
          </button>
        </div>

        {session?.user && (
          <div style={{ marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => {
                setCollectionOpen((v) => !v);
                setSpheresOpen(false);
                setContactsOpen(false);
              }}
              className={`sidebar-nav-link ${collectionOpen ? 'active' : ''}`}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                border: 'none',
                background: 'transparent',
                font: 'inherit',
                color: 'inherit',
                padding: 0,
                textAlign: 'left',
              }}
            >
              <i className="fas fa-layer-group" />
              Сборка
              <i className={`fas fa-chevron-${collectionOpen ? 'left' : 'right'}`} style={{ fontSize: '0.75rem', marginLeft: 'auto' }} />
            </button>
          </div>
        )}
        {session?.user && (
          <div style={{ marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => {
                setContactsOpen((v) => !v);
                setSpheresOpen(false);
                setCollectionOpen(false);
              }}
              className={`sidebar-nav-link ${contactsOpen ? 'active' : ''}`}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                border: 'none',
                background: 'transparent',
                font: 'inherit',
                color: 'inherit',
                padding: 0,
                textAlign: 'left',
              }}
            >
              <i className="fas fa-address-book" />
              Контакты и чаты
              {unreadCount > 0 && (
                <span
                  className="sidebar-contact-badge"
                  style={{
                    fontSize: '0.7rem',
                    minWidth: 18,
                    height: 18,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 5px',
                    borderRadius: 9,
                    background: 'var(--accent-primary)',
                    color: 'var(--accent-primary-foreground)',
                  }}
                  aria-label="Непрочитанных сообщений"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              <i className={`fas fa-chevron-${contactsOpen ? 'left' : 'right'}`} style={{ fontSize: '0.75rem', marginLeft: 'auto' }} />
            </button>
          </div>
        )}

        {universeSlug && (
          <>
            <div className="sidebar-nav-label">Разделы</div>
            <div style={{ marginBottom: 16 }}>
              {[
                { href: `/universes/${universeSlug}`, label: 'Контент', icon: 'fa-folder-open', active: isContentSection },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-nav-link ${item.active ? 'active' : ''}`}
                >
                  <i className={`fas ${item.icon}`} />
                  {item.label}
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="sidebar-nav-label">Общее</div>
        <div>
          {[
            { href: '/explore', label: 'Лента (В тренде)', icon: 'fa-fire', active: pathname === '/explore' },
            { href: '/rooms', label: 'Аудио-комнаты', icon: 'fa-microphone-alt', active: pathname === '/rooms' },
            { href: '/me/mind-maps', label: 'Мои карты', icon: 'fa-project-diagram', active: pathname?.startsWith('/me/mind-maps') },
            { href: '/settings', label: 'Настройки', icon: 'fa-gear', active: pathname === '/settings' },
            { href: '/digest', label: 'Дайджест', icon: 'fa-newspaper', active: pathname === '/digest' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-link ${item.active ? 'active' : ''}`}
            >
              <i className={`fas ${item.icon}`} />
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => setMiniAppOpen(true)}
            className="sidebar-nav-link w-full text-left"
          >
            <i className="fas fa-layer-group" />
            Приложения (Mini-App)
          </button>
        </div>
      </nav>
    </aside>
  );
}
