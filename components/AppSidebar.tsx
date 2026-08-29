'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import type { Session } from 'next-auth';
import { CreateUniverseDialog } from '@/app/universes/CreateUniverseDialog';
import { SferaSphereIcon } from '@/components/SferaSphereIcon';
import { AddUserSourceForm } from '@/components/AddUserSourceForm';

import { SidebarNavLinks } from '@/components/sidebar/SidebarNavLinks';
import { useTranslation } from '@/components/i18n/LanguageProvider';

type UniverseRow = { slug: string; name: string; description: string | null; icon: string | null; sphereColor: string | null; ownerId?: string | null };
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
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [spheresOpen, setSpheresOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [universes, setUniverses] = useState<UniverseRow[]>([]);
  const [spheresSearchQuery, setSpheresSearchQuery] = useState('');
  const [universesLoading, setUniversesLoading] = useState(false);
  const [contextUniverse, setContextUniverse] = useState<UniverseRow | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [trackedSlugs, setTrackedSlugs] = useState<Set<string>>(new Set());
  const [deletePromptUniverse, setDeletePromptUniverse] = useState<UniverseRow | null>(null);
  const [deletingUniverse, setDeletingUniverse] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
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
  const contextMenuRef = useRef<HTMLDivElement>(null);

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

    if (session?.user?.id) {
      fetch('/api/me/universes', { credentials: 'include' })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setTrackedSlugs(new Set(data.map((u: any) => u.slug)));
          }
        })
        .catch(() => {});
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (!contextUniverse) return;
    const handleClick = (e: Event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextUniverse(null);
      }
    };
    const handleScroll = () => setContextUniverse(null);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('contextmenu', handleClick, true);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('contextmenu', handleClick, true);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [contextUniverse]);

  const handleUniverseContextMenu = (e: React.MouseEvent, u: UniverseRow) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 200);
    setContextMenuPos({ x, y });
    setContextUniverse(u);
  };

  const handleShareUniverse = (u: UniverseRow) => {
    setContextUniverse(null);
    const url = `${window.location.origin}/universes/${encodeURIComponent(u.slug)}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2200);
  };

  const handleToggleTrackUniverse = async (u: UniverseRow) => {
    setContextUniverse(null);
    if (!session?.user?.id) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || '/')}`);
      return;
    }
    const isTracked = trackedSlugs.has(u.slug);
    try {
      const res = await fetch(`/api/universes/${encodeURIComponent(u.slug)}/track`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setTrackedSlugs((prev) => {
          const next = new Set(prev);
          if (isTracked) next.delete(u.slug);
          else next.add(u.slug);
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to toggle track', err);
    }
  };

  const handleConfirmDeleteUniverse = async () => {
    if (!deletePromptUniverse || deletingUniverse) return;
    setDeletingUniverse(true);
    try {
      const res = await fetch(`/api/universes/${encodeURIComponent(deletePromptUniverse.slug)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setUniverses((prev) => prev.filter((u) => u.slug !== deletePromptUniverse.slug));
        if (pathname?.includes(`/universes/${deletePromptUniverse.slug}`)) {
          router.push('/');
        }
        setDeletePromptUniverse(null);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || t('common.error', 'Ошибка при удалении'));
      }
    } catch (e) {
      console.error(e);
      alert(t('common.error', 'Ошибка при удалении'));
    } finally {
      setDeletingUniverse(false);
    }
  };

  const filteredUniverses = useMemo(() => {
    if (spheresSearchQuery.trim()) {
      return universes.filter((u) => matchesSphereQuery(u, spheresSearchQuery));
    }
    const currentUserId = session?.user?.id;
    if (currentUserId) {
      return universes.filter(
        (u) => trackedSlugs.has(u.slug) || (u.ownerId && u.ownerId === currentUserId)
      );
    }
    return universes;
  }, [universes, spheresSearchQuery, session?.user?.id, trackedSlugs]);

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
  const isContentSection = Boolean(universeSlug);
  const totalUnread = Object.values(unreadByContact).reduce((a, b) => a + b, 0);
  return (
    <>
      {/* Навигация */}
      <SidebarNavLinks
        session={session}
        pathname={pathname ?? ''}
        spheresOpen={spheresOpen}
        setSpheresOpen={setSpheresOpen}
        contactsOpen={contactsOpen}
        setContactsOpen={setContactsOpen}
        collectionOpen={collectionOpen}
        setCollectionOpen={setCollectionOpen}
        unreadCount={totalUnread}
        universeSlug={universeSlug}
      />

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
            <span className="sidebar-nav-label" style={{ marginBottom: 0 }}>{t('contacts.title', 'Контакты и чаты')}</span>
            <button
              type="button"
              onClick={() => setContactsOpen(false)}
              aria-label={t('common.hide', 'Скрыть')}
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
                placeholder={t('contacts.search', 'Поиск по тегу (@user)')}
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
                  <p className="sidebar-nav-label" style={{ marginBottom: 8, fontSize: '0.75rem' }}>{t('contacts.searchResults', 'Результаты поиска')}</p>
                  {searching ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('contacts.searching', 'Поиск…')}</p>
                  ) : searchResults.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('contacts.nothingFound', 'Ничего не найдено')}</p>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {searchResults.map((u) => {
                        const isContact = contacts.some((c) => c.id === u.id);
                        const isOutgoing = requests.outgoing.some((r) => r.toUser?.id === u.id);
                        const canAdd = !isContact && !isOutgoing && u.id !== session?.user?.id;
                        const displayName = u.name || u.userTag || t('contentCard.member', 'Пользователь');
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
                                title={t('contacts.addToFriends', 'Добавить в друзья')}
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
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>{t('contacts.inContacts', 'в контактах')}</span>
                            ) : isOutgoing ? (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>{t('contacts.requestSent', 'запрос отправлен')}</span>
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
                  <p className="sidebar-nav-label" style={{ marginBottom: 8, fontSize: '0.75rem' }}>{t('contacts.incoming', 'Входящие запросы')}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {requests.incoming.map((r) => (
                      <li key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--studio-panel-border)' }}>
                        <p style={{ fontSize: '0.85rem', marginBottom: 8 }}>
                          {t('contentCard.member', 'Пользователь')} <strong>@{r.fromUser?.userTag ?? r.fromUser?.name ?? t('contentCard.member', 'пользователь')}</strong> {t('contacts.incomingText', 'хочет добавить вас в друзья.')}
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
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('common.loading', 'Загрузка…')}</p>
              ) : contacts.length === 0 && groups.length === 0 && searchQuery.trim().length < 2 && requests.incoming.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {t('contacts.noContacts', 'Введите тег в поиске (например @user), чтобы найти и добавить контакты')}
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
          <span className="sidebar-nav-label" style={{ marginBottom: 0 }}>{t('rooms.title', 'Комнаты')}</span>
          <button
            type="button"
            onClick={() => setSpheresOpen(false)}
            aria-label={t('common.hide', 'Скрыть')}
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
              placeholder={t('rooms.search', 'Поиск по названию')}
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
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('common.loading', 'Загрузка…')}</p>
            ) : filteredUniverses.length === 0 ? (
              spheresSearchQuery.trim() ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {t('rooms.search', 'Ничего не найдено')}
                </p>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--text-muted)' }}>
                  <i className="fas fa-shapes mb-2 text-2xl opacity-40 block" aria-hidden />
                  <p style={{ fontSize: '0.85rem', margin: '0 0 14px' }}>
                    {t('rooms.noTrackedRooms', 'Вы пока не отслеживаете ни одной комнаты')}
                  </p>
                  <Link
                    href="/explore"
                    onClick={() => setSpheresOpen(false)}
                    className="platform-btn platform-btn-sm"
                    style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <i className="fa-solid fa-compass" /> {t('nav.feed', 'Найти в Ленте')}
                  </Link>
                </div>
              )
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {filteredUniverses.map((u) => {
                  const isOwner = Boolean(session?.user?.id && u.ownerId === session.user.id);
                  return (
                    <li key={u.slug} style={{ marginBottom: 2 }}>
                      <Link
                        href={`/universes/${encodeURIComponent(u.slug)}`}
                        className={`sidebar-sphere-item ${pathname?.split('/')[2] === u.slug ? 'active' : ''}`}
                        onContextMenu={(e) => handleUniverseContextMenu(e, u)}
                        style={isOwner ? { borderLeft: '2px solid var(--accent-primary)' } : undefined}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                          <SferaSphereIcon size="sm" color={u.sphereColor} icon={u.icon} name={u.name} />
                        </div>
                        <span style={{ flex: 1, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.name}
                        </span>
                        {isOwner && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: 'rgba(var(--accent-primary-rgb, 139, 92, 246), 0.15)',
                              color: 'var(--accent-primary)',
                              border: '1px solid rgba(var(--accent-primary-rgb, 139, 92, 246), 0.3)',
                              fontWeight: 700,
                              letterSpacing: '0.02em',
                              flexShrink: 0,
                              marginLeft: 6,
                            }}
                            title={t('common.owner', 'Автор')}
                          >
                            ★ {t('common.owner', 'Автор')}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
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
            <span className="sidebar-nav-label" style={{ marginBottom: 0 }}>{t('nav.assembly', 'Сборка')}</span>
            <button
              type="button"
              onClick={() => setCollectionOpen(false)}
              aria-label={t('common.hide', 'Скрыть')}
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
                placeholder={t('sources.search', 'Поиск по названию')}
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
                {collectionAggregating ? t('sources.aggregating', 'Агрегация…') : t('sources.runAggregation', 'Запустить агрегацию')}
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
                {t('content.feedTitle', 'Лента контента')}
              </Link>
              {userSourcesLoading ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('common.loading', 'Загрузка…')}</p>
              ) : filteredUserSources.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {collectionSearchQuery.trim() ? t('sources.nothingFound', 'Ничего не найдено') : t('sources.addHint', 'Добавьте источники (RSS, YouTube, Telegram и т.д.)')}
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

    {/* Кастомное контекстное меню по ПКМ для комнат */}
    {contextUniverse && typeof document !== 'undefined' && createPortal(
      <>
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99998 }}
          onClick={() => setContextUniverse(null)}
          onContextMenu={(e) => { e.preventDefault(); setContextUniverse(null); }}
        />
        <div
          ref={contextMenuRef}
          className="glass-panel"
          style={{
            position: 'fixed',
            left: contextMenuPos.x,
            top: contextMenuPos.y,
            zIndex: 99999,
            minWidth: 200,
            padding: '6px',
            borderRadius: 12,
            background: 'var(--studio-panel-bg)',
            border: '1px solid var(--studio-panel-border)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: '6px 10px 4px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--studio-panel-border)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {contextUniverse.name}
          </div>

          {/* 1. Поделиться */}
          <button
            type="button"
            className="platform-btn platform-btn-sm w-full justify-start gap-2.5"
            style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', textAlign: 'left', padding: '8px 10px', fontSize: '0.85rem' }}
            onClick={() => handleShareUniverse(contextUniverse)}
          >
            <i className="fa-solid fa-share-nodes text-[var(--accent-primary)]" aria-hidden />
            {t('rooms.share', 'Поделиться')}
          </button>

          {/* 2. Отслеживать / Не отслеживать */}
          <button
            type="button"
            className="platform-btn platform-btn-sm w-full justify-start gap-2.5"
            style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', textAlign: 'left', padding: '8px 10px', fontSize: '0.85rem' }}
            onClick={() => handleToggleTrackUniverse(contextUniverse)}
          >
            <i className={`fa-solid ${trackedSlugs.has(contextUniverse.slug) ? 'fa-bell-slash text-amber-400' : 'fa-bell text-[var(--accent-primary)]'}`} aria-hidden />
            {trackedSlugs.has(contextUniverse.slug)
              ? t('rooms.unfollow', 'Не отслеживать')
              : t('rooms.follow', 'Отслеживать')}
          </button>

          {/* 3. Удалить (если владелец или сид) */}
          {(session?.user?.id && (contextUniverse.ownerId === session.user.id || !contextUniverse.ownerId)) && (
            <button
              type="button"
              className="platform-btn platform-btn-sm w-full justify-start gap-2.5"
              style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', textAlign: 'left', padding: '8px 10px', fontSize: '0.85rem', color: 'var(--text-danger, #e5534b)' }}
              onClick={() => {
                const u = contextUniverse;
                setContextUniverse(null);
                setDeletePromptUniverse(u);
              }}
            >
              <i className="fa-solid fa-trash text-red-500" aria-hidden />
              {t('rooms.deleteRoom', 'Удалить')}
            </button>
          )}
        </div>
      </>,
      document.body
    )}

    {/* Модальное окно подтверждения удаления комнаты */}
    {deletePromptUniverse && typeof document !== 'undefined' && createPortal(
      <>
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => !deletingUniverse && setDeletePromptUniverse(null)}
          aria-hidden
        />
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 99999,
            background: 'var(--studio-panel-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 16,
            padding: '24px',
            minWidth: 320,
            maxWidth: 420,
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '1.2rem', flexShrink: 0 }}>
              <i className="fa-solid fa-triangle-exclamation" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                {t('rooms.deleteRoomConfirm', 'Удалить комнату')}?
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                «{deletePromptUniverse.name}»
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              onClick={handleConfirmDeleteUniverse}
              disabled={deletingUniverse}
              className="platform-btn platform-btn-primary platform-btn-sm"
              style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444' }}
            >
              {deletingUniverse ? '…' : t('rooms.deleteRoom', 'Удалить')}
            </button>
            <button
              type="button"
              onClick={() => setDeletePromptUniverse(null)}
              disabled={deletingUniverse}
              className="platform-btn platform-btn-sm"
              style={{ flex: 1 }}
            >
              {t('common.cancel', 'Отмена')}
            </button>
          </div>
        </div>
      </>,
      document.body
    )}

    {/* Уведомление о скопированной ссылке */}
    {copiedToast && typeof document !== 'undefined' && createPortal(
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 100000,
          background: 'var(--accent-primary)',
          color: '#fff',
          padding: '10px 18px',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '0.9rem',
          fontWeight: 600,
          animation: 'fadeIn 0.2s ease',
        }}
      >
        <i className="fa-solid fa-check" />
        {t('rooms.copiedLink', 'Ссылка скопирована')}
      </div>,
      document.body
    )}
    </>
  );
}
