'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GifPicker } from '@/components/GifPicker';
import { EmojiPicker } from '@/components/EmojiPicker';
import { MindMapCanvas } from '@/components/room/MindMapCanvas';
import { SphereViewer } from '@/components/room/SphereViewer';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  useParticipants,
  useConnectionState,
  useChat,
} from '@livekit/components-react';
import '@livekit/components-styles';

export default function GlassRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.uid as string;

  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'speakers' | 'mindmap' | 'sphere'>('speakers');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!roomId) return;
    fetch(`/api/spaces/token?room=${roomId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch token or LiveKit not configured');
        return res.json();
      })
      .then((data) => {
        if (data.token) {
          setToken(data.token);
        } else {
          setError(data.error || 'Unknown error');
        }
      })
      .catch((e) => setError(e.message));
  }, [roomId]);

  if (!mounted) return null;

  if (error) {
    return (
      <div className="studio-page-wrap">
        <div className="studio-card" style={{ maxWidth: '800px', padding: 40, textAlign: 'center' }}>
          <h2 style={{ marginBottom: 16 }}>Ошибка подключения</h2>
          <p style={{ color: 'var(--alert-error)', marginBottom: 24 }}>{error}</p>
          <button onClick={() => router.push('/rooms')} className="studio-ctrl-btn">
            Вернуться к списку комнат
          </button>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="studio-page-wrap">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 16px auto', borderTopColor: 'var(--accent-primary)' }} />
            Подключение к эфиру...
          </div>
        </div>
      </div>
    );
  }

  const liveKitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880';

  return (
    <div className="fade-in" style={{ padding: '16px', height: 'calc(100dvh - 64px)', width: '100%', display: 'flex', overflow: 'hidden' }}>
      <LiveKitRoom
        video={false}
        audio={true}
        token={token}
        serverUrl={liveKitUrl}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
        onDisconnected={() => router.push('/rooms')}
      >
        {/* Огромный стеклянный контейнер всей комнаты на весь экран */}
        <div
          className="glass-card"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid color-mix(in srgb, var(--accent-primary) 30%, var(--border-subtle))',
            background: 'color-mix(in srgb, var(--bg-secondary) 50%, rgba(0,0,0,0.4))',
            backdropFilter: 'blur(60px) saturate(200%)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Декоративное фоновое свечение внутри комнаты */}
          <div style={{ position: 'absolute', top: '-10%', left: '40%', width: '40vw', height: '40vw', background: 'var(--accent-primary)', opacity: 0.08, filter: 'blur(100px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-10%', right: '10%', width: '30vw', height: '30vw', background: 'var(--accent-green)', opacity: 0.05, filter: 'blur(100px)', pointerEvents: 'none' }} />

          {/* Шапка комнаты */}
          <div className="flex items-center justify-between" style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(255, 255, 255, 0.02)',
            zIndex: 1
          }}>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <h1 className="text-gradient" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Эфир {roomId.slice(0, 8)}</h1>
              
              <div className="flex bg-[rgba(255,255,255,0.05)] p-1 rounded-xl border border-[rgba(255,255,255,0.1)] gap-1">
                <button onClick={() => setActiveTab('speakers')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'speakers' ? 'bg-[var(--accent-primary)] text-white' : 'text-gray-400 hover:text-white'}`}>
                  🎙️ Спикеры
                </button>
                <button onClick={() => setActiveTab('mindmap')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'mindmap' ? 'bg-[var(--accent-primary)] text-white' : 'text-gray-400 hover:text-white'}`}>
                  🧠 Карта
                </button>
                <button onClick={() => setActiveTab('sphere')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'sphere' ? 'bg-[var(--accent-primary)] text-white' : 'text-gray-400 hover:text-white'}`}>
                  🌐 Сфера
                </button>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <ConnectionStatus />
                <span style={{ color: 'var(--text-muted)' }}>·</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}><i className="fas fa-headphones" /> Слушают</span>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/rooms')}
              className="btn-glow shrink-0"
              style={{
                background: 'color-mix(in srgb, #ff4c4c 20%, transparent)',
                border: '1px solid #ff4c4c',
                color: '#ff4c4c',
                padding: '10px 20px',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ff4c4c';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 76, 76, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'color-mix(in srgb, #ff4c4c 20%, transparent)';
                e.currentTarget.style.color = '#ff4c4c';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <i className="fas fa-door-open" /> Покинуть эфир
            </button>
          </div>

          {/* Основная сцена (Спикеры + Чат) */}
          <div className="flex flex-col md:flex-row flex-1 min-h-0 z-[1] overflow-hidden">
            
            {/* Зона контента / Спикеров */}
            <div className="flex-1 min-w-0 min-h-0 relative flex flex-col">
              {activeTab === 'speakers' && (
                <>
                  <div className="flex-1 overflow-y-auto" style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center', alignContent: 'center' }}>
                    <ActiveSpeakers />
                  </div>

                  {/* Красивый контрол-бар (Микрофон) внизу зоны спикеров */}
                  <div className="shrink-0 flex justify-center w-full" style={{ padding: '16px 20px', background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}>
                    <div className="custom-control-bar glass-panel shadow-xl" style={{ padding: '8px 12px', borderRadius: 'var(--radius-full)', display: 'flex', gap: 12, border: '1px solid var(--border-subtle)' }}>
                      <ControlBar variation="minimal" controls={{ microphone: true, camera: false, screenShare: false, chat: false, leave: false }} />
                    </div>
                  </div>
                </>
              )}
              
              {activeTab === 'mindmap' && (
                <div className="flex-1 w-full h-full p-4 fade-in">
                  <MindMapCanvas />
                </div>
              )}

              {activeTab === 'sphere' && (
                <div className="flex-1 w-full h-full p-4 fade-in">
                  <SphereViewer />
                </div>
              )}
            </div>

            {/* Панель (Чат) справа - на мобилках будет внизу, либо скрыта, если узко */}
            <div className="flex flex-col shrink-0 border-t md:border-t-0 md:border-l w-full md:w-[320px] lg:w-[400px] h-[300px] md:h-auto" style={{
              borderColor: 'var(--border-subtle)',
              background: 'rgba(0, 0, 0, 0.25)',
            }}>
              <div className="shrink-0 flex items-center gap-2" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 className="m-0 text-[1.1rem] font-semibold text-primary flex items-center gap-2">
                  <i className="fas fa-comments text-gradient" /> Чат комнаты
                </h3>
              </div>
              <div className="flex-1 relative min-h-0">
                <div className="lk-chat-container-override absolute inset-0 flex flex-col">
                  <CustomGlassChat />
                </div>
              </div>
            </div>
          </div>
        </div>

        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

function ConnectionStatus() {
  const state = useConnectionState();
  const isConnected = state === 'connected';
  
  return (
    <div style={{ 
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: isConnected ? 'color-mix(in srgb, var(--accent-green) 15%, transparent)' : 'rgba(255,255,255,0.05)',
      border: `1px solid ${isConnected ? 'color-mix(in srgb, var(--accent-green) 30%, transparent)' : 'rgba(255,255,255,0.1)'}`,
      padding: '4px 12px', borderRadius: 20
    }}>
      <span style={{ 
        width: 8, height: 8, borderRadius: 4, 
        background: isConnected ? 'var(--accent-green)' : 'var(--text-secondary)',
        boxShadow: isConnected ? '0 0 10px var(--accent-green)' : 'none',
        animation: isConnected ? 'pulse 2s infinite' : 'none'
      }} />
      <span style={{ 
        color: isConnected ? 'var(--accent-green)' : 'var(--text-secondary)', 
        fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' 
      }}>
        {isConnected ? 'LIVE' : state === 'connecting' ? 'Соединение...' : 'Отключено'}
      </span>
    </div>
  );
}

function ActiveSpeakers() {
  const participants = useParticipants();

  if (participants.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <i className="fas fa-microphone-lines" style={{ fontSize: '3rem', opacity: 0.2 }} />
        <span>Ожидание первого спикера...</span>
      </div>
    );
  }

  return (
    <>
      {participants.map((p, i) => {
        const isSpeaking = p.isSpeaking;
        const initials = (p.name || p.identity || '?').slice(0, 2).toUpperCase();
        
        return (
          <div key={p.sid} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isSpeaking ? 'scale(1.1) translateY(-10px)' : 'scale(1)',
          }}>
            <div 
              style={{
                width: 140, height: 140, borderRadius: 70, // Идеальный круг
                background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 70%, black), var(--accent-primary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '3rem', fontWeight: 700, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                border: isSpeaking ? '4px solid var(--accent-green)' : '4px solid rgba(255,255,255,0.1)',
                boxShadow: isSpeaking 
                  ? '0 0 40px color-mix(in srgb, var(--accent-green) 60%, transparent), inset 0 0 20px rgba(255,255,255,0.2)' 
                  : '0 10px 30px rgba(0,0,0,0.5), inset 0 2px 10px rgba(255,255,255,0.1)',
                position: 'relative',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {initials}
              {p.isMicrophoneEnabled === false && (
                <div style={{ 
                  position: 'absolute', bottom: 0, right: 0, 
                  background: 'var(--bg-primary)', borderRadius: '50%', padding: 4 
                }}>
                  <div style={{ 
                    width: 36, height: 36, borderRadius: 18, 
                    background: 'var(--alert-error)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                    boxShadow: '0 4px 10px rgba(255, 76, 76, 0.4)'
                  }}>
                    <i className="fas fa-microphone-slash" />
                  </div>
                </div>
              )}
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ 
                fontSize: '1.2rem', fontWeight: 600, 
                color: isSpeaking ? '#fff' : 'var(--text-primary)',
                textShadow: isSpeaking ? '0 0 10px rgba(255,255,255,0.5)' : 'none'
              }}>
                {p.name || p.identity || 'Аноним'}
              </span>
              {p.isLocal && <div style={{ marginTop: 4, fontSize: '0.9rem', color: 'var(--accent-primary)', fontWeight: 500 }}>Вы (в эфире)</div>}
            </div>
          </div>
        );
      })}
    </>
  );
}

function CustomGlassChat() {
  const { send, chatMessages, isSending } = useChat();
  const [message, setMessage] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      send(message.trim());
      setMessage('');
    }
  };

  const handleGifPick = (url: string) => {
    send(url); // Отправляем URL гифки сразу в чат
  };

  const handleEmojiPick = (emoji: string) => {
    setMessage(prev => prev + emoji); // Добавляем эмодзи в поле ввода
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div ref={containerRef} className="flex-1 overflow-y-auto lk-chat-messages" style={{ padding: '16px 16px 24px 16px' }}>
        {chatMessages.map(msg => {
          const isGif = msg.message.startsWith('https://media') && msg.message.includes('giphy.com');
          return (
            <div key={msg.id} className="lk-chat-entry group relative" style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
               <div className="lk-meta-data">
                 <span className="lk-participant-name">{msg.from?.name || msg.from?.identity || 'Аноним'}</span>
                 <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
               </div>
               <div className="lk-message-body mt-1">
                 {isGif ? (
                   <img src={msg.message} alt="GIF" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'cover' }} />
                 ) : (
                   msg.message
                 )}
               </div>
            </div>
          );
        })}
      </div>
      
      <form onSubmit={handleSubmit} className="shrink-0 p-3 flex items-center gap-2 border-t" style={{ borderColor: 'var(--border-subtle)', background: 'rgba(0,0,0,0.15)' }}>
        <input 
          type="text" 
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Написать..." 
          className="flex-1 lk-chat-form-input"
          style={{ padding: '10px 14px', borderRadius: 'var(--radius-lg)' }}
        />
        
        <EmojiPicker onPick={handleEmojiPick}>
          <i className="fas fa-smile text-[1.2rem]" style={{ color: 'var(--text-secondary)' }} />
        </EmojiPicker>

        <GifPicker onPick={handleGifPick}>
          <span /> {/* Dummy child for TS since GifPicker requires children but ignores them */}
        </GifPicker>
        
        <button 
          type="submit" 
          disabled={!message.trim() || isSending} 
          className="btn-glow shrink-0 font-semibold flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
          style={{ width: 40, height: 40, background: 'var(--accent-primary)', color: '#fff', borderRadius: 10 }}
        >
          <i className="fas fa-paper-plane" />
        </button>
      </form>
    </div>
  );
}
