'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CreateGroupModal } from '@/components/CreateGroupModal';

type ConversationItem = {
  userId: string;
  userName: string | null;
  userImage: string | null;
  lastMessage: {
    id: string;
    senderId: string;
    body: string;
    createdAt: string;
    readAt: string | null;
  } | null;
  lastMessageAt: string | null;
};

type GroupItem = {
  id: string;
  name: string;
  participants: Array<{ userId: string; name: string | null; image: string | null }>;
  lastMessage: { id: string; senderId: string; body: string; createdAt: string } | null;
  lastMessageAt: string | null;
};

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const shareContent = searchParams.get('shareContent');
  const shareTitle = searchParams.get('shareTitle');
  const shareSlug = searchParams.get('shareSlug');
  const shareQuery = shareContent && shareSlug
    ? `?shareContent=${encodeURIComponent(shareContent)}&shareTitle=${encodeURIComponent(shareTitle || '')}&shareSlug=${encodeURIComponent(shareSlug)}`
    : '';

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/me/conversations', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/me/group-chats', { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([convos, grps]) => {
        if (!cancelled) {
          setConversations(Array.isArray(convos) ? convos : []);
          setGroups(Array.isArray(grps) ? grps : []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const allItems: Array<{ type: 'dm' | 'group'; key: string; lastAt: string; link: string; title: string; subtitle: string; image: string | null }> = [
    ...conversations.map((c) => ({
      type: 'dm' as const,
      key: c.userId,
      lastAt: c.lastMessageAt ?? c.lastMessage?.createdAt ?? '',
      link: `/messages/${encodeURIComponent(c.userId)}${shareQuery}`,
      title: c.userName ?? 'Участник',
      subtitle: c.lastMessage?.body?.slice(0, 80) ?? '',
      image: c.userImage,
    })),
    ...groups.map((g) => ({
      type: 'group' as const,
      key: g.id,
      lastAt: g.lastMessageAt ?? g.lastMessage?.createdAt ?? '',
      link: `/messages/group/${g.id}${shareQuery}`,
      title: g.name,
      subtitle: g.lastMessage?.body?.slice(0, 80) ?? '',
      image: g.participants[0]?.image ?? null,
    })),
  ].sort((a, b) => b.lastAt.localeCompare(a.lastAt));

  return (
    <div className="platform-page">
      <div className="platform-card" style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="platform-card-title" style={{ marginBottom: 8 }}>
          <i className="fa-regular fa-message" aria-hidden /> Сообщения
        </div>
        <p className="platform-card-desc mb-6">
          Личные диалоги и групповые чаты.
        </p>

        {shareContent && shareSlug && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-accent)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              Пересылаете материал
            </div>
            <Link
              href={`/universes/${encodeURIComponent(shareSlug)}/content/${encodeURIComponent(shareContent)}`}
              style={{
                fontWeight: 600,
                color: 'var(--accent-primary)',
                textDecoration: 'none',
                wordBreak: 'break-word',
              }}
            >
              {shareTitle ? decodeURIComponent(shareTitle) : 'Материал'}
            </Link>
          </div>
        )}

        {loading ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Загрузка…</p>
        ) : allItems.length === 0 ? (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.95rem',
            }}
          >
            <i className="fa-regular fa-message" style={{ fontSize: '2rem', marginBottom: 12, display: 'block', opacity: 0.5 }} />
            Пока нет диалогов.
            <br />
            <Link href="/" style={{ color: 'var(--accent-primary)', textDecoration: 'underline', marginTop: 8, display: 'inline-block' }}>
              Добавить контакты
            </Link>
          </div>
        ) : (
          <ul className="list-none p-0 m-0">
            {allItems.map((item) => (
              <li key={item.type + item.key}>
                <Link
                  href={item.link}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    color: 'inherit',
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background 0.15s',
                  }}
                  className="hover:bg-[var(--studio-participant-bg)]"
                >
                  {item.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.image} alt="" width={44} height={44} style={{ borderRadius: 12, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 600 }}>
                      {item.type === 'group' ? <i className="fa-solid fa-users" style={{ fontSize: '1rem', color: 'var(--text-secondary)' }} /> : item.title.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.title}</div>
                    {item.subtitle && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.subtitle}{item.subtitle.length >= 80 ? '…' : ''}
                      </div>
                    )}
                  </div>
                  {item.lastAt && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(item.lastAt).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowCreateGroup(true)}
            className="platform-btn platform-btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <i className="fa-solid fa-users" /> Создать группу
          </button>
          <Link
            href="/"
            className="platform-btn platform-btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <i className="fa-regular fa-address-book" /> Контакты
          </Link>
        </div>
        {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
      </div>
    </div>
  );
}
