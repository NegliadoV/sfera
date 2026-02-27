'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Session } from 'next-auth';
import { CreateUniverseDialog } from '@/app/universes/CreateUniverseDialog';
import { SferaSphereIcon } from '@/components/SferaSphereIcon';
import { AddUserSourceForm } from '@/components/AddUserSourceForm';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';

type UniverseRow = { slug: string; name: string; description: string | null; icon: string | null; sphereColor: string | null };
type Contact = { id: string; name: string | null; email: string | null; image: string | null };

type GroupChat = {
  id: string;
  name: string;
  participants: Array<{ userId: string; name: string | null; image: string | null }>;
};

type SearchUser = { id: string; name: string | null; image: string | null; userTag: string | null };
type RequestItem = {
  id: string;
  fromUser?: { id: string; name: string | null; image: string | null; userTag?: string | null };
  toUser?: { id: string; name: string | null; image: string | null };
  status: string;
  createdAt: string;
};

function normalizeSearch(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
}

function matchesSphereQuery(u: UniverseRow, q: string): boolean {
  if (!q.trim()) return true;
  const nq = normalizeSearch(q);
  const name = normalizeSearch(u.name);
  const slug = normalizeSearch(u.slug);
  const desc = (u.description && normalizeSearch(u.description)) || '';
  return name.includes(nq) || slug.includes(nq) || desc.includes(nq);
}

export function AppSidebar({ session = null }: { session?: Session | null }) {
  const pathname = usePathname();
  const [spheresOpen, setSpheresOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [universes, setUniverses] = useState<UniverseRow[]>([]);
  const [spheresSearchQuery, setSpheresSearchQuery] = useState('');
  const [universesLoading, setUniversesLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [requests, setRequests] = useState<{ incoming: RequestItem[]; outgoing: RequestItem[] }>({ incoming: [], outgoing: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [unreadByContact, setUnreadByContact] = useState<Record<string, number>>({});
  const [userSources, setUserSources] = useState<Array<{ id: string; name: string; provider: string; enabled: boolean; url?: string | null }>>([]);
  const [userSourcesLoading, setUserSourcesLoading] = useState(false);
  const [collectionSearchQuery, setCollectionSearchQuery] = useState('');
  const [collectionAggregating, setCollectionAggregating] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRequests = () => {
    if (!session?.user?.id) return;
    fetch('/api/me/contacts/requests', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setRequests(
        data?.incoming != null && data?.outgoing != null
          ? { incoming: data.incoming, outgoing: data.outgoing }
          : { incoming: [], outgoing: [] }
      ))
      .catch(() => setRequests({ incoming: [], outgoing: [] }));
  };

  const fetchGroups = () => {
    if (!session?.user?.id) return;
    fetch('/api/me/group-chats', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setGroups(Array.isArray(data) ? data : []))
      .catch(() => setGroups([]));
  };

  const fetchUnreadCounts = () => {
    if (!session?.user?.id) return;
    fetch('/api/me/conversations/unread-counts', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setUnreadByContact(typeof data === 'object' && data !== null ? data : {}))
      .catch(() => setUnreadByContact({}));
  };

  const fetchContacts = () => {
    if (!session?.user?.id) return;
    setContactsLoading(true);
    fetch('/api/me/contacts', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setContacts(Array.isArray(data) ? data : []))
      .catch(() => setContacts([]))
      .finally(() => setContactsLoading(false));
  };

  const fetchUniverses = () => {
    fetch('/api/universes', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setUniverses(Array.isArray(data) ? data : []))
      .catch(() => setUniverses([]));
  };

  useEffect(() => {
    setUniversesLoading(true);
    fetch('/api/universes', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setUniverses(Array.isArray(data) ? data : []);
      })
      .catch(() => setUniverses([]))
      .finally(() => setUniversesLoading(false));
  }, []);

  const filteredUniverses = useMemo(
    () => (spheresSearchQuery.trim() ? universes.filter((u) => matchesSphereQuery(u, spheresSearchQuery)) : universes),
    [universes, spheresSearchQuery]
  );

  const fetchUserSources = () => {
    if (!session?.user?.id) return;
    setUserSourcesLoading(true);
    fetch('/api/me/sources', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setUserSources(Array.isArray(data) ? data : []))
      .catch(() => setUserSources([]))
      .finally(() => setUserSourcesLoading(false));
  };

  const filteredUserSources = useMemo(() => {
    if (!collectionSearchQuery.trim()) return userSources;
    const q = collectionSearchQuery.toLowerCase();
    return userSources.filter((s) => s.name.toLowerCase().includes(q));
  }, [userSources, collectionSearchQuery]);

  useEffect(() => {
    if (collectionOpen && session?.user?.id) fetchUserSources();
  }, [collectionOpen, session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) {
      setContacts([]);
      return;
    }
    let cancelled = false;
    setContactsLoading(true);
    fetch('/api/me/contacts', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setContacts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setContacts([]);
      })
      .finally(() => {
        if (!cancelled) setContactsLoading(false);
      });

    fetchGroups();
    fetchUnreadCounts();

    fetchRequests();

    const onRefresh = () => {
      fetchContacts();
      fetchGroups();
      fetchRequests();
      fetchUnreadCounts();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchUnreadCounts();
    };

    window.addEventListener('messages-badge-refresh', onRefresh);
    document.addEventListener('visibilitychange', onVisibilityChange);

    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchUnreadCounts();
    }, 30000);

    return () => {
      cancelled = true;
      window.removeEventListener('messages-badge-refresh', onRefresh);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(pollInterval);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearching(true);
      fetch(`/api/me/contacts/search?query=${encodeURIComponent(searchQuery.trim())}`, { credentials: 'include' })
        .then((r) => r.json())
        .then((data) => setSearchResults(Array.isArray(data) ? data : []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery]);

  async function handleAddContact(toUserId: string) {
    const res = await fetch('/api/me/contacts/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ toUserId }),
    });
    if (res.ok) {
      fetchRequests();
      window.dispatchEvent(new CustomEvent('messages-badge-refresh'));
    }
  }

  async function handleRequestAction(requestId: string, action: 'accept' | 'decline') {
    const res = await fetch(`/api/me/contacts/requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      window.dispatchEvent(new CustomEvent('messages-badge-refresh'));
      setRequests((prev) => ({
        ...prev,
        incoming: prev.incoming.filter((r) => r.id !== requestId),
      }));
      if (action === 'accept') {
        const data = await fetch('/api/me/contacts', { credentials: 'include' }).then((r) => r.json());
        if (Array.isArray(data)) setContacts(data);
      }
    }
  }

  const universeSlug = pathname?.startsWith('/universes/')
    ? pathname.split('/')[2]
    : null;
  const isUniverseRoot = Boolean(universeSlug && pathname === `/universes/${universeSlug}`);
  const isRooms = Boolean(pathname?.includes('/rooms'));
  const isMindMaps = Boolean(pathname?.includes('/mind-maps'));
  const isContentSection = isUniverseRoot && !isRooms && !isMindMaps;
  return (
    <>
      {/* Навигация */}
      <aside
        className="sidebar-nav-section"
        style={{
          width: 240,
          minWidth: 240,
          flexShrink: 0,
          padding: '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          borderRight: (contactsOpen || spheresOpen || collectionOpen) ? '1px solid var(--studio-panel-border)' : 'none',
        }}
      >
        {session?.user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
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
                // eslint-disable-next-line @next/next/no-img-element -- external avatar URL
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
        <div className="sidebar-nav-label">Сферы</div>
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
            <i className="fas fa-compass" />
            {universeSlug ? '← К сферам' : 'Сферы'}
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
              {Object.values(unreadByContact).reduce((a, b) => a + b, 0) > 0 && (
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
                  {Object.values(unreadByContact).reduce((a, b) => a + b, 0) > 99 ? '99+' : Object.values(unreadByContact).reduce((a, b) => a + b, 0)}
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
                { href: `/universes/${universeSlug}`, label: 'Контент', icon: 'fa-align-left', active: isContentSection },
                { href: `/universes/${universeSlug}/rooms`, label: 'Комнаты просмотра', icon: 'fa-video', active: isRooms },
                { href: `/universes/${universeSlug}/mind-maps`, label: 'Ментальные карты', icon: 'fa-project-diagram', active: isMindMaps },
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
        </div>
      </nav>
    </aside>

    {/* Панель контактов справа от навигации */}
    {session?.user && (
      <div
        className="sidebar-contacts-drawer"
        data-open={contactsOpen}
        style={{
          width: contactsOpen ? 260 : 0,
          flexShrink: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--studio-panel-bg)',
          transition: 'width 0.25s ease',
        }}
      >
        <div style={{ width: 260, minWidth: 260, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 14px', borderBottom: '1px solid var(--studio-panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span className="sidebar-nav-label" style={{ marginBottom: 0 }}>Контакты и чаты</span>
            <button
              type="button"
              onClick={() => setContactsOpen(false)}
              aria-label="Скрыть контакты"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
              }}
            >
              <i className="fas fa-times" />
            </button>
          </div>
          <div className="sidebar-contacts" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--studio-panel-border)', flexShrink: 0 }}>
              <input
                type="text"
                placeholder="Поиск по тегу (@user)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                  background: 'var(--studio-panel-bg)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 14px' }}>
              {searchQuery.trim().length >= 2 && (
                <div style={{ marginBottom: 16 }}>
                  <p className="sidebar-nav-label" style={{ marginBottom: 8, fontSize: '0.75rem' }}>Результаты поиска</p>
                  {searching ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Поиск…</p>
                  ) : searchResults.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ничего не найдено</p>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {searchResults.map((u) => {
                        const isContact = contacts.some((c) => c.id === u.id);
                        const isOutgoing = requests.outgoing.some((r) => r.toUser?.id === u.id);
                        const canAdd = !isContact && !isOutgoing && u.id !== session?.user?.id;
                        const displayName = u.name || u.userTag || 'Пользователь';
                        return (
                          <li key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--studio-panel-border)' }}>
                            {u.image ? (
                              <img src={u.image} alt="" width={28} height={28} style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                                {(displayName || '?')[0]}
                              </div>
                            )}
                            <span style={{ flex: 1, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {displayName}{u.userTag ? ` @${u.userTag}` : ''}
                            </span>
                            {canAdd ? (
                              <button
                                type="button"
                                onClick={() => handleAddContact(u.id)}
                                title="Добавить в друзья"
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 8,
                                  border: '1px solid var(--border-color)',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '1rem',
                                  color: 'var(--text-secondary)',
                                  flexShrink: 0,
                                }}
                              >
                                +
                              </button>
                            ) : isContact ? (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>в контактах</span>
                            ) : isOutgoing ? (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>запрос отправлен</span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
              {requests.incoming.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p className="sidebar-nav-label" style={{ marginBottom: 8, fontSize: '0.75rem' }}>Входящие запросы</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {requests.incoming.map((r) => (
                      <li key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--studio-panel-border)' }}>
                        <p style={{ fontSize: '0.85rem', marginBottom: 8 }}>
                          Пользователь <strong>@{r.fromUser?.userTag ?? r.fromUser?.name ?? 'пользователь'}</strong> хочет добавить вас в друзья.
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => handleRequestAction(r.id, 'accept')}
                            style={{
                              fontSize: '0.8rem',
                              padding: '6px 12px',
                              borderRadius: 8,
                              border: 'none',
                              background: 'var(--accent)',
                              color: 'var(--accent-foreground)',
                              cursor: 'pointer',
                            }}
                          >
                            Принять
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestAction(r.id, 'decline')}
                            style={{
                              fontSize: '0.8rem',
                              padding: '6px 12px',
                              borderRadius: 8,
                              border: '1px solid var(--border-color)',
                              background: 'transparent',
                              cursor: 'pointer',
                            }}
                          >
                            Отклонить
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {contactsLoading ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Загрузка…</p>
              ) : contacts.length === 0 && groups.length === 0 && searchQuery.trim().length < 2 && requests.incoming.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Введите тег в поиске (например @user), чтобы найти и добавить контакты
                </p>
              ) : (
                <ul className="sidebar-contacts-list">
                  {groups.map((g) => (
                    <li key={`group-${g.id}`}>
                      <Link
                        href={`/messages/group/${g.id}`}
                        className={`sidebar-contact-item ${pathname === `/messages/group/${g.id}` ? 'active' : ''}`}
                      >
                        <div
                          className="sidebar-contact-avatar"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: 'var(--bg-accent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            flexShrink: 0,
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <i className="fas fa-users" />
                        </div>
                        <span className="sidebar-contact-name">{g.name}</span>
                      </Link>
                    </li>
                  ))}
                  {contacts.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/messages/${encodeURIComponent(c.id)}`}
                        className={`sidebar-contact-item ${pathname === `/messages/${c.id}` ? 'active' : ''}`}
                      >
                        {c.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.image}
                            alt=""
                            width={32}
                            height={32}
                            style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                          />
                        ) : (
                          <div
                            className="sidebar-contact-avatar"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: 'var(--bg-accent)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: 14,
                              flexShrink: 0,
                            }}
                          >
                            {(c.name ?? c.id).slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className="sidebar-contact-name">{c.name ?? 'Участник'}</span>
                        {unreadByContact[c.id] > 0 && (
                          <span
                            className="sidebar-contact-badge"
                            aria-label={`${unreadByContact[c.id]} непрочитанных`}
                          >
                            {unreadByContact[c.id] > 99 ? '99+' : unreadByContact[c.id]}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    {/* Панель сфер */}
    <div
      className="sidebar-contacts-drawer"
      data-open={spheresOpen}
      style={{
        width: spheresOpen ? 260 : 0,
        flexShrink: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--studio-panel-bg)',
        transition: 'width 0.25s ease',
      }}
    >
      <div style={{ width: 260, minWidth: 260, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 14px', borderBottom: '1px solid var(--studio-panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span className="sidebar-nav-label" style={{ marginBottom: 0 }}>Сферы</span>
          <button
            type="button"
            onClick={() => setSpheresOpen(false)}
            aria-label="Скрыть сферы"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
            }}
          >
            <i className="fas fa-times" />
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--studio-panel-border)', flexShrink: 0 }}>
            <input
              type="text"
              placeholder="Поиск по названию"
              value={spheresSearchQuery}
              onChange={(e) => setSpheresSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem',
                background: 'var(--studio-panel-bg)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 14px' }}>
            {session?.user && (
              <div style={{ marginBottom: 16 }}>
                <CreateUniverseDialog compact />
              </div>
            )}
            {universesLoading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Загрузка…</p>
            ) : filteredUniverses.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {spheresSearchQuery.trim() ? 'Ничего не найдено' : 'Пока нет сфер'}
              </p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {filteredUniverses.map((u) => (
                  <li key={u.slug} style={{ marginBottom: 2 }}>
                    <Link
                      href={`/universes/${encodeURIComponent(u.slug)}`}
                      className={`sidebar-sphere-item ${pathname?.split('/')[2] === u.slug ? 'active' : ''}`}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        <SferaSphereIcon size="sm" color={u.sphereColor} />
                      </div>
                      <span style={{ flex: 1, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Панель Сборка */}
    {session?.user && (
      <div
        className="sidebar-contacts-drawer"
        data-open={collectionOpen}
        style={{
          width: collectionOpen ? 260 : 0,
          flexShrink: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--studio-panel-bg)',
          transition: 'width 0.25s ease',
        }}
      >
        <div style={{ width: 260, minWidth: 260, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 14px', borderBottom: '1px solid var(--studio-panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span className="sidebar-nav-label" style={{ marginBottom: 0 }}>Сборка</span>
            <button
              type="button"
              onClick={() => setCollectionOpen(false)}
              aria-label="Скрыть"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
              }}
            >
              <i className="fas fa-times" />
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--studio-panel-border)', flexShrink: 0 }}>
              <input
                type="text"
                placeholder="Поиск по названию"
                value={collectionSearchQuery}
                onChange={(e) => setCollectionSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                  background: 'var(--studio-panel-bg)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 14px' }}>
              <div style={{ marginBottom: 12 }}>
                <AddUserSourceForm onAdded={fetchUserSources} />
              </div>
              <button
                type="button"
                onClick={async () => {
                  setCollectionAggregating(true);
                  try {
                    await fetch('/api/me/sources/aggregate', { method: 'POST', credentials: 'include' });
                    fetchUserSources();
                  } finally {
                    setCollectionAggregating(false);
                  }
                }}
                disabled={collectionAggregating || userSources.length === 0}
                style={{
                  width: '100%',
                  marginBottom: 16,
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border-color)',
                  background: 'var(--accent-primary)',
                  color: 'var(--accent-primary-foreground)',
                  fontSize: '0.9rem',
                  cursor: collectionAggregating || userSources.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: userSources.length === 0 ? 0.6 : 1,
                }}
              >
                {collectionAggregating ? 'Агрегация…' : 'Запустить агрегацию'}
              </button>
              <Link
                href="/me/content"
                style={{
                  display: 'block',
                  marginBottom: 16,
                  fontSize: '0.9rem',
                  color: 'var(--accent-primary)',
                  textDecoration: 'underline',
                }}
              >
                <i className="fas fa-rss" style={{ marginRight: 6 }} />
                Лента контента
              </Link>
              {userSourcesLoading ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Загрузка…</p>
              ) : filteredUserSources.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {collectionSearchQuery.trim() ? 'Ничего не найдено' : 'Добавьте источники (RSS, YouTube, Telegram и т.д.)'}
                </p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {filteredUserSources.map((s) => (
                    <li key={s.id} style={{ marginBottom: 4 }}>
                      <div
                        className="sidebar-sphere-item"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          borderRadius: 10,
                          cursor: 'default',
                        }}
                      >
                        <Link
                          href={`/me/sources/${s.id}`}
                          onClick={() => setCollectionOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            flex: 1,
                            minWidth: 0,
                            textDecoration: 'none',
                            color: 'inherit',
                          }}
                        >
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                            <i className="fas fa-rss" style={{ color: 'var(--text-secondary)' }} />
                          </div>
                          <span style={{ flex: 1, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.name}
                          </span>
                        </Link>
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const res = await fetch(`/api/me/sources/${s.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ enabled: !s.enabled }),
                            });
                            if (res.ok) fetchUserSources();
                          }}
                          title={s.enabled ? 'Выключить' : 'Включить'}
                          style={{
                            width: 36,
                            height: 24,
                            borderRadius: 12,
                            border: 'none',
                            background: s.enabled ? 'var(--accent-primary)' : 'var(--border-color)',
                            cursor: 'pointer',
                            position: 'relative',
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              top: 2,
                              left: s.enabled ? 'auto' : 2,
                              right: s.enabled ? 2 : 'auto',
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: 'white',
                              transition: 'left 0.2s, right 0.2s',
                            }}
                          />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
