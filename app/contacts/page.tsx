'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';

type Contact = { id: string; name: string | null; email: string | null; image: string | null; isContact?: boolean; isOutgoing?: boolean };
type RequestObj = { id: string; fromUser?: Contact; toUser?: Contact; status: string; createdAt: string };

export default function ContactsPage() {
  const router = useRouter();
  const { session, isReady } = useAuthGuard();
  
  const [activeTab, setActiveTab] = useState<'contacts' | 'search'>('contacts');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [incoming, setIncoming] = useState<RequestObj[]>([]);
  const [outgoing, setOutgoing] = useState<RequestObj[]>([]);
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  if (!isReady) return null;

  const fetchContactsAndRequests = async () => {
    setLoading(true);
    try {
      const [ctsRes, reqsRes] = await Promise.all([
        fetch('/api/me/contacts', { credentials: 'include' }),
        fetch('/api/me/contacts/requests', { credentials: 'include' })
      ]);
      if (ctsRes.ok) {
        const cts = await ctsRes.json();
        setContacts(Array.isArray(cts) ? cts : []);
      }
      if (reqsRes.ok) {
        const reqs = await reqsRes.json();
        setIncoming(reqs.incoming || []);
        setOutgoing(reqs.outgoing || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactsAndRequests();
  }, []);

  useEffect(() => {
    if (activeTab !== 'search' || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/me/contacts/search?query=${encodeURIComponent(searchQuery.trim())}`, { credentials: 'include' });
        if (res.ok) {
          const results = await res.json();
          setSearchResults(Array.isArray(results) ? results : []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setSearchLoading(false);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchQuery, activeTab]);

  const handleAddContact = async (userId: string) => {
    try {
      const res = await fetch('/api/me/contacts/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: userId }),
      });
      if (res.ok) {
        fetchContactsAndRequests();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/me/contacts/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' }),
      });
      if (res.ok) {
        fetchContactsAndRequests();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/me/contacts/requests/${requestId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        fetchContactsAndRequests();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full max-w-lg mx-auto p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between mb-6 mt-2">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Контакты</h1>
      </div>

      <div className="flex p-1 mb-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
            activeTab === 'contacts' 
              ? 'bg-[var(--accent-primary)] text-white shadow-md' 
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--text-secondary)_10%,transparent)]'
          }`}
        >
          Мои контакты {incoming.length > 0 && <span className="ml-2 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-xs">{incoming.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
            activeTab === 'search' 
              ? 'bg-[var(--accent-primary)] text-white shadow-md' 
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--text-secondary)_10%,transparent)]'
          }`}
        >
          Найти
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar pr-2 pb-6">
        {activeTab === 'search' && (
          <div className="flex flex-col gap-4">
            <div className="relative">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Поиск по нику или имени..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[var(--bg-secondary)] border-2 border-transparent focus:border-[var(--accent-primary)] text-[var(--text-primary)] transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {searchLoading ? (
               <div className="flex justify-center p-6"><div className="w-8 h-8 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent animate-spin" /></div>
            ) : searchResults.length > 0 ? (
              <div className="flex flex-col gap-2 mt-2">
                {searchResults.map((u) => {
                  if (u.id === session?.user?.id) return null;
                  const isContact = contacts.some((c) => c.id === u.id);
                  const isOutgoing = outgoing.some((r) => r.toUser?.id === u.id);
                  const isIncoming = incoming.some((r) => r.fromUser?.id === u.id);

                  return (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                      <div className="flex items-center gap-3 overflow-hidden">
                         <div className="w-10 h-10 rounded-[12px] bg-[var(--bg-accent)] flex items-center justify-center shrink-0 overflow-hidden">
                           {u.image ? <img src={u.image} alt="Avatar" className="w-full h-full object-cover" /> : <i className="fas fa-user text-[var(--text-secondary)]" />}
                         </div>
                         <div className="flex flex-col min-w-0">
                           <span className="font-semibold text-[15px] truncate text-[var(--text-primary)]">{u.name || 'Аноним'}</span>
                         </div>
                      </div>
                      
                      <div className="shrink-0 ml-3">
                        {isContact ? (
                          <button onClick={() => router.push(`/messages/${u.id}`)} className="w-[36px] h-[36px] flex items-center justify-center bg-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] text-[var(--accent-primary)] rounded-[12px] hover:bg-[color-mix(in_srgb,var(--accent-primary)_30%,transparent)] transition-colors">
                             <i className="fas fa-paper-plane" />
                          </button>
                        ) : isOutgoing ? (
                          <div className="px-3 py-1.5 rounded-[10px] bg-[var(--bg-accent)] border border-[var(--border-subtle)] text-[12px] text-[var(--text-secondary)] whitespace-nowrap">
                            Запрос отправлен
                          </div>
                        ) : isIncoming ? (
                          <div className="px-3 py-1.5 rounded-[10px] bg-[color-mix(in_srgb,var(--accent-purple)_20%,transparent)] text-[var(--accent-purple)] text-[12px] whitespace-nowrap">
                            Ожидает ответа
                          </div>
                        ) : (
                          <button onClick={() => handleAddContact(u.id)} className="w-[36px] h-[36px] flex items-center justify-center bg-[var(--accent-primary)] text-white rounded-[12px] hover:brightness-110 transition-colors shadow-sm shadow-[var(--accent-primary-muted)]">
                             <i className="fas fa-user-plus" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : searchQuery.trim() !== '' ? (
              <div className="text-center p-8 text-[var(--text-secondary)] text-sm bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border-subtle)] border-dashed mt-4">
                Пользователи не найдены
              </div>
            ) : (
               <div className="text-center p-8 text-[var(--text-secondary)] text-sm bg-[color-mix(in_srgb,var(--bg-secondary)_50%,transparent)] rounded-3xl mt-4">
                 Введите имя в поиск...
               </div>
            )}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="flex flex-col gap-6">
            
            {/* Incoming Requests Section */}
            {incoming.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-1 px-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-purple)] shadow-[0_0_8px_var(--accent-purple)] animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Заявки ({incoming.length})</span>
                </div>
                {incoming.map((req) => (
                  <div key={req.id} className="flex flex-col gap-3 p-4 rounded-2xl bg-[color-mix(in_srgb,var(--accent-purple)_5%,transparent)] border border-[color-mix(in_srgb,var(--accent-purple)_20%,transparent)]">
                     <div className="flex items-center gap-3 overflow-hidden">
                         <div className="w-10 h-10 rounded-[12px] bg-[var(--bg-accent)] flex items-center justify-center shrink-0 overflow-hidden">
                           {req.fromUser?.image ? <img src={req.fromUser.image} alt="Avatar" className="w-full h-full object-cover" /> : <i className="fas fa-user text-[var(--text-secondary)]" />}
                         </div>
                         <div className="flex flex-col min-w-0">
                           <span className="font-semibold text-[15px] truncate text-[var(--text-primary)]">{req.fromUser?.name || 'Аноним'}</span>
                           <span className="text-[12px] text-[var(--text-secondary)]">Хочет добавить вас</span>
                         </div>
                     </div>
                     <div className="flex gap-2 w-full mt-1">
                       <button onClick={() => handleAcceptRequest(req.id)} className="flex-1 py-2 bg-[var(--accent-primary)] text-white rounded-[12px] text-sm font-semibold hover:brightness-110 shadow-sm shadow-[var(--accent-primary-muted)] transition-all">
                         Добавить
                       </button>
                       <button onClick={() => handleDeclineRequest(req.id)} className="flex-1 py-2 bg-transparent border border-[var(--text-danger)] text-[var(--text-danger)] rounded-[12px] text-sm font-semibold hover:bg-[color-mix(in_srgb,var(--text-danger)_10%,transparent)] transition-all">
                         Скрыть
                       </button>
                     </div>
                  </div>
                ))}
              </div>
            )}

            {/* Contacts Section */}
            <div className="flex flex-col gap-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 px-1">Френдлист ({contacts.length})</div>
              {loading ? (
                <div className="flex justify-center p-6"><div className="w-8 h-8 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent animate-spin" /></div>
              ) : contacts.length === 0 ? (
                <div className="text-center p-8 bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border-subtle)] border-dashed flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--bg-accent)] flex items-center justify-center mb-4 text-[var(--text-secondary)]">
                    <i className="fas fa-user-friends text-xl" />
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)] mb-1">Тут пока пусто</span>
                  <span className="text-[13px] text-[var(--text-secondary)] leading-relaxed">Ищите знакомых во вкладке Найти или пригласите друзей.</span>
                  <button onClick={() => setActiveTab('search')} className="mt-4 px-5 py-2 rounded-xl bg-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)] text-[var(--accent-primary)] text-sm font-semibold">Найти друзей</button>
                </div>
              ) : (
                contacts.map((c) => (
                  <div key={c.id} onClick={() => router.push(`/messages/${c.id}`)} className="flex items-center gap-4 p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] cursor-pointer hover:border-[var(--accent-primary)] hover:bg-[color-mix(in_srgb,var(--accent-primary)_5%,transparent)] transition-all group">
                     <div className="w-12 h-12 rounded-[14px] bg-[var(--bg-accent)] flex items-center justify-center shrink-0 overflow-hidden relative">
                       {c.image ? <img src={c.image} alt="Avatar" className="w-full h-full object-cover" /> : <i className="fas fa-user text-[var(--text-secondary)] text-lg" />}
                     </div>
                     <div className="flex flex-col min-w-0 flex-1">
                       <span className="font-semibold text-[16px] truncate text-[var(--text-primary)]">{c.name || 'Аноним'}</span>
                     </div>
                     <div className="w-8 h-8 rounded-full bg-[color-mix(in_srgb,var(--text-secondary)_10%,transparent)] flex items-center justify-center text-[var(--text-secondary)] group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-all mr-1">
                       <i className="fas fa-chevron-right text-xs" />
                     </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
