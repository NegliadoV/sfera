'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Space = {
  id: string;
  name: string;
  description: string | null;
  type: 'audio' | 'video';
  creatorId: string;
  isPrivate: boolean;
};

export default function GlobalRoomsPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const router = useRouter();

  const fetchSpaces = async () => {
    try {
      const res = await fetch('/api/spaces');
      if (res.ok) {
        const data = await res.json();
        setSpaces(data.spaces || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
    const int = setInterval(fetchSpaces, 15000);
    return () => clearInterval(int);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: newDesc, type: 'audio' }),
      });
      if (!res.ok) throw new Error('Failed to create space');
      const data = await res.json();
      router.push(`/rooms/${data.space.id}`);
    } catch (e) {
      console.error(e);
      setCreating(false);
    }
  };

  return (
    <div className="platform-page fade-in" style={{ padding: '2rem' }}>
      <div className="platform-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            Голосовые комнаты
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: 0 }}>
            Слушайте, обсуждайте и создавайте новые форматы интерактива
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-glow"
          style={{
            background: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)',
            border: '1px solid var(--accent-primary)',
            color: 'var(--text-primary)',
            padding: '12px 28px',
            borderRadius: 'var(--radius-full)',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            transition: 'all 0.3s ease',
            textShadow: '0 0 10px var(--accent-primary)',
            boxShadow: '0 0 20px color-mix(in srgb, var(--accent-primary) 30%, transparent)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-primary)';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.boxShadow = '0 0 40px var(--accent-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'color-mix(in srgb, var(--accent-primary) 20%, transparent)';
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.boxShadow = '0 0 20px color-mix(in srgb, var(--accent-primary) 30%, transparent)';
          }}
        >
          <i className="fas fa-plus" /> Создать эфир
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--accent-primary)' }}>
          <div className="spinner" style={{ margin: '0 auto 16px auto', width: 40, height: 40, borderTopColor: 'var(--accent-primary)' }} />
          <p>Синхронизация пространств...</p>
        </div>
      ) : spaces.length === 0 ? (
        <div className="glass-panel" style={{ 
          textAlign: 'center', padding: '80px 40px', 
          borderRadius: 'var(--radius-xl)', 
          background: 'color-mix(in srgb, var(--bg-secondary) 40%, transparent)',
          border: '1px dashed var(--border-color)',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: 40, 
            background: 'color-mix(in srgb, var(--bg-accent) 50%, transparent)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 24px auto', fontSize: '2rem', color: 'var(--text-muted)' 
          }}>
            <i className="fas fa-microphone-slash" />
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: 12 }}>В эфире пока тихо</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 400, margin: '0 auto' }}>
            Станьте первым: создайте свою комнату и начните обсуждение.
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' 
        }}>
          {spaces.map(space => (
            <div
              key={space.id}
              onClick={() => router.push(`/rooms/${space.id}`)}
              className="glass-card"
              style={{
                borderRadius: 'var(--radius-xl)',
                padding: '24px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid var(--border-subtle)',
                background: 'color-mix(in srgb, var(--bg-secondary) 60%, transparent)',
                backdropFilter: 'blur(30px) saturate(150%)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent-primary) 50%, transparent)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3), inset 0 0 0 1px color-mix(in srgb, var(--accent-primary) 20%, transparent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Фоновое свечение в карточке */}
              <div style={{
                position: 'absolute', top: '-50px', right: '-50px',
                width: '150px', height: '150px',
                background: 'var(--accent-primary)', opacity: 0.15,
                filter: 'blur(50px)', pointerEvents: 'none'
              }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 28,
                  background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 80%, black), var(--accent-primary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem', color: '#fff',
                  boxShadow: '0 8px 20px color-mix(in srgb, var(--accent-primary) 40%, transparent)'
                }}>
                  <i className="fas fa-satellite-dish" />
                </div>
                
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: 6, 
                  background: 'color-mix(in srgb, var(--accent-green) 15%, transparent)', 
                  padding: '4px 12px', borderRadius: 20,
                  border: '1px solid color-mix(in srgb, var(--accent-green) 30%, transparent)'
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--accent-green)', boxShadow: '0 0 8px var(--accent-green)', animation: 'pulse 2s infinite' }}></span>
                  <span style={{ color: 'var(--accent-green)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>LIVE</span>
                </div>
              </div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.3 }}>{space.name}</h3>
                {space.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '0 0 20px 0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {space.description}
                  </p>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', marginLeft: 8 }}>
                       {/* Имитация слушателей */}
                       <div style={{ width: 24, height: 24, borderRadius: 12, background: 'var(--bg-accent)', border: '2px solid var(--studio-panel-bg)', marginLeft: -8 }} />
                       <div style={{ width: 24, height: 24, borderRadius: 12, background: 'color-mix(in srgb, var(--accent-primary) 50%, black)', border: '2px solid var(--studio-panel-bg)', marginLeft: -8 }} />
                       <div style={{ width: 24, height: 24, borderRadius: 12, background: 'color-mix(in srgb, var(--accent-green) 50%, black)', border: '2px solid var(--studio-panel-bg)', marginLeft: -8 }} />
                    </div>
                    Участники
                  </div>
                  <span style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: 500 }}>
                    Войти &rarr;
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999,
          animation: 'fadeIn 0.2s ease'
        }}>
          <form
            onSubmit={handleCreate}
            className="glass-card"
            style={{
              background: 'color-mix(in srgb, var(--bg-primary) 80%, transparent)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              padding: 40,
              width: 480,
              maxWidth: '90vw',
              boxShadow: '0 30px 60px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Декоративное свечение модалки */}
            <div style={{ position: 'absolute', top: -50, left: -50, width: 200, height: 200, background: 'var(--accent-primary)', filter: 'blur(80px)', opacity: 0.15, pointerEvents: 'none' }} />

            <h2 style={{ marginTop: 0, marginBottom: 32, fontSize: '1.8rem', fontWeight: 700, position: 'relative', zIndex: 1 }}>Создать эфир</h2>
            
            <div style={{ marginBottom: 24, position: 'relative', zIndex: 1 }}>
              <label style={{ display: 'block', marginBottom: 12, color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>Название комнаты</label>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Тема для обсуждения"
                required
                className="input-glass"
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  color: '#fff',
                  fontSize: '1.05rem',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent-primary)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            <div style={{ marginBottom: 32, position: 'relative', zIndex: 1 }}>
              <label style={{ display: 'block', marginBottom: 12, color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>Описание (необязательно)</label>
              <textarea
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="О чем будем говорить?"
                rows={3}
                className="input-glass"
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  color: '#fff',
                  fontSize: '1rem',
                  resize: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent-primary)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', position: 'relative', zIndex: 1 }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '14px 24px',
                  background: 'color-mix(in srgb, var(--bg-secondary) 50%, transparent)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-lg)',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'color-mix(in srgb, var(--bg-secondary) 50%, transparent)'}
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={creating || !newName.trim()}
                style={{
                  padding: '14px 32px',
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '1.05rem',
                  letterSpacing: '0.02em',
                  cursor: creating || !newName.trim() ? 'not-allowed' : 'pointer',
                  borderRadius: 'var(--radius-lg)',
                  opacity: (creating || !newName.trim()) ? 0.5 : 1,
                  boxShadow: '0 8px 20px color-mix(in srgb, var(--accent-primary) 40%, transparent)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { if (!creating && newName.trim()) e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none' }}
              >
                {creating ? "Запуск..." : "В эфир!"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
