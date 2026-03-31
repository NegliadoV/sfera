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
  useLocalParticipant,
  useConnectionState,
  useChat,
  TrackToggle,
  useTracks,
  VideoTrack,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useRNNoiseFilter } from '@/hooks/useRNNoiseFilter';
import '@livekit/components-styles';

export default function RoomClient({ initialToken, rId, isOpenMic, canPublish }: { initialToken: string, rId: string, isOpenMic?: boolean, canPublish?: boolean }) {
  const router = useRouter();
  const roomId = rId;

  const [token] = useState(initialToken);
  const [error] = useState('');
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'speakers' | 'mindmap' | 'sphere' | 'chat'>('speakers');
  const [isDeafened, setIsDeafened] = useState(false);

  useEffect(() => {
    setMounted(true);

    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const msg = args.map(a => (a?.message || String(a))).join(' ');
      if (msg.includes('Unknown DataChannel error')) {
        return; // Suppress harmless LiveKit renegotiation error
      }
      originalConsoleError(...args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

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
    <div className="fade-in flex-1 flex flex-col w-full overflow-hidden p-2 md:p-4 shrink-0">
      <LiveKitRoom
        video={false}
        audio={false}
        screen={false} // Мы вручную управляем Share
        token={token}
        serverUrl={liveKitUrl}
        options={{
          publishDefaults: {
            // High quality voice (Discord standard)
            audioPreset: { maxBitrate: 64_000 },
            dtx: true, // Включаем VAD (Voice Activity Detection), чтобы микрофон отключался в тишине
            red: true,
          },
          audioCaptureDefaults: {
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true,
          }
        }}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <RoomAudioRenderer volume={isDeafened ? 0 : 1} muted={isDeafened} />
        {/* Огромный стеклянный контейнер всей комнаты на весь экран */}
        <div
          className="glass-card relative"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid color-mix(in srgb, var(--accent-primary) 30%, var(--border-subtle))',
            background: 'color-mix(in srgb, var(--bg-secondary) 50%, rgba(0,0,0,0.6))',
            backdropFilter: 'blur(20px) saturate(150%)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Декоративное фоновое свечение внутри комнаты (только для больших экранов, чтобы не сжигать GPU на мобилках) */}
          <div className="hidden md:block absolute pointer-events-none" style={{ top: '-10%', left: '40%', width: '40vw', height: '40vw', background: 'var(--accent-primary)', opacity: 0.08, filter: 'blur(100px)' }} />
          <div className="hidden md:block absolute pointer-events-none" style={{ bottom: '-10%', right: '10%', width: '30vw', height: '30vw', background: 'var(--accent-green)', opacity: 0.05, filter: 'blur(100px)' }} />

          {/* Шапка комнаты */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 md:p-6 border-b z-[2] w-full" style={{
            borderColor: 'var(--border-subtle)',
            background: 'rgba(255, 255, 255, 0.02)',
          }}>
            <div className="flex w-full md:w-auto flex-row items-center justify-between md:justify-start gap-4 shrink-0">
              <h1 className="text-gradient m-0 text-xl md:text-[1.4rem] font-bold truncate">Эфир {roomId.slice(0, 8)}</h1>
              
              <button
                onClick={() => router.push('/rooms')}
                className="md:hidden shrink-0 flex items-center justify-center p-2 rounded-lg text-red-500 bg-red-500/10 border border-red-500/20 text-sm transition-transform active:scale-95"
              >
                <i className="fas fa-door-open" />
              </button>
            </div>
            
            <div className="flex w-full md:w-auto overflow-x-auto no-scrollbar gap-2 pb-2 md:pb-0 shrink-0">
               <div className="flex bg-[rgba(255,255,255,0.05)] p-1 rounded-xl border border-[rgba(255,255,255,0.1)] gap-1 min-w-max">
                <button onClick={() => setActiveTab('speakers')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'speakers' ? 'bg-[var(--accent-primary)] text-white' : 'text-gray-400 hover:text-white'}`}>
                  🎙️ Спикеры
                </button>
                <button onClick={() => setActiveTab('chat')} className={`md:hidden px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'chat' ? 'bg-[var(--accent-primary)] text-white' : 'text-gray-400 hover:text-white'}`}>
                  💬 Чат
                </button>
                <button onClick={() => setActiveTab('mindmap')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'mindmap' ? 'bg-[var(--accent-primary)] text-white' : 'text-gray-400 hover:text-white'}`}>
                  🧠 Карта
                </button>
                <button onClick={() => setActiveTab('sphere')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'sphere' ? 'bg-[var(--accent-primary)] text-white' : 'text-gray-400 hover:text-white'}`}>
                  🌐 Сфера
                </button>
               </div>
            </div>

            <div className="hidden md:flex items-center gap-4 shrink-0 justify-end flex-1">
              <div className="flex items-center gap-2">
                <ConnectionStatus />
                <span style={{ color: 'var(--text-muted)' }}>·</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}><i className="fas fa-headphones" /> Слушают</span>
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
                <i className="fas fa-door-open" /> Покинуть
              </button>
            </div>
          </div>

          {/* Основная сцена (Спикеры + Чат) */}
          <div className="flex flex-col md:flex-row flex-1 min-h-0 z-[1] overflow-hidden">
            
            {/* Зона контента / Спикеров */}
            <div className="flex-1 min-w-0 min-h-0 relative flex flex-col">
              {activeTab === 'speakers' && (
                <div className="flex-1 overflow-y-auto" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                  <ScreenShareView />
                  <ActiveSpeakers isOpenMicProp={isOpenMic} />
                </div>
              )}
              
              {activeTab === 'chat' && (
                <div className="flex-1 w-full h-full md:hidden fade-in relative flex flex-col min-h-0">
                  <CustomGlassChat />
                </div>
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

              {/* Permanent Room Controls visible across all tabs */}
              <RoomControls 
                isOpenMicProp={isOpenMic} 
                canPublishProp={canPublish}
                isDeafened={isDeafened}
                setIsDeafened={setIsDeafened}
              />
            </div>

            {/* Панель (Чат) справа - полностью скрыта на мобилках, видна на десктопе */}
            <div className="hidden md:flex flex-col shrink-0 border-l w-[320px] lg:w-[400px]" style={{
              borderColor: 'color-mix(in srgb, var(--border-subtle) 50%, transparent)',
              background: 'rgba(0, 0, 0, 0.1)',
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

function ActiveSpeakers({ isOpenMicProp }: { isOpenMicProp?: boolean }) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const params = useParams();
  const roomId = params.uid as string;

  // Оптимистично добавляем себя в список, чтобы не ждать 2 секунды хэндшейка WebRTC
  const displayParticipants = participants.some(p => p.identity === localParticipant.identity)
    ? participants 
    : localParticipant.identity ? [localParticipant, ...participants] : participants;

  let localMeta: any = {};
  if (localParticipant.metadata) {
    try { localMeta = JSON.parse(localParticipant.metadata); } catch(e) {}
  }
  const isModerator = localMeta.role === 'moderator';
  const isOpenMic = localMeta.isOpenMic ?? isOpenMicProp;

  const parsedMeta = (p: any) => { try { return JSON.parse(p.metadata || '{}'); } catch(e) { return {}; } };
  const speakers = displayParticipants.filter(p => {
    const role = parsedMeta(p).role;
    return isOpenMic || role === 'moderator' || role === 'speaker' || p.permissions?.canPublish;
  });
  const listeners = displayParticipants.filter(p => !speakers.includes(p));

  const toggleSpeech = async (p: any, action: 'grant' | 'revoke') => {
    try {
      await fetch('/api/spaces/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, participantIdentity: p.identity, action })
      });
    } catch(e) { console.error(e); }
  };

  const renderSpeaker = (p: any, role: 'speaker'|'listener') => {
    const isSpeaking = p.isSpeaking;
    const initials = (p.name || p.identity || '?').slice(0, 2).toUpperCase();
    let pMeta: any = {};
    if (p.metadata) { try { pMeta = JSON.parse(p.metadata); } catch(e){} }
    const handRaised = pMeta.handRaised;
    
    return (
      <div key={p.sid} style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isSpeaking ? 'scale(1.1) translateY(-10px)' : 'scale(1)',
      }}>
        <div 
          style={{
            width: role === 'speaker' ? 'clamp(80px, 25vw, 140px)' : 'clamp(50px, 15vw, 80px)', 
            height: role === 'speaker' ? 'clamp(80px, 25vw, 140px)' : 'clamp(50px, 15vw, 80px)', 
            borderRadius: '50%',
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 70%, black), var(--accent-primary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: role === 'speaker' ? '3rem' : '1.5rem', fontWeight: 700, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            border: isSpeaking ? '4px solid var(--accent-green)' : '4px solid rgba(255,255,255,0.1)',
            boxShadow: isSpeaking 
              ? '0 0 40px color-mix(in srgb, var(--accent-green) 60%, transparent), inset 0 0 20px rgba(255,255,255,0.2)' 
              : '0 10px 30px rgba(0,0,0,0.5), inset 0 2px 10px rgba(255,255,255,0.1)',
            position: 'relative',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {initials}
          {role === 'speaker' && p.isMicrophoneEnabled === false && (
            <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--bg-primary)', borderRadius: '50%', padding: 4 }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--alert-error)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', boxShadow: '0 4px 10px rgba(255, 76, 76, 0.4)' }}>
                <i className="fas fa-microphone-slash" />
              </div>
            </div>
          )}
          {handRaised && role === 'listener' && (
            <div style={{ position: 'absolute', top: -10, right: -10, background: 'var(--bg-primary)', borderRadius: '50%', padding: 4 }}>
              <div className="animate-bounce" style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--accent-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', boxShadow: '0 0 10px var(--accent-primary)' }}>
                🖐️
              </div>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: role === 'speaker' ? '1.2rem' : '1rem', fontWeight: 600, color: isSpeaking ? '#fff' : 'var(--text-primary)', textShadow: isSpeaking ? '0 0 10px rgba(255,255,255,0.5)' : 'none' }}>
            {p.name || p.identity || 'Аноним'}
          </span>
          {p.isLocal && <div style={{ marginTop: 4, fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 500 }}>Вы</div>}
          {pMeta.role === 'moderator' && <div style={{ marginTop: 4, fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: 500 }}>Модератор</div>}
          
          {!isOpenMic && isModerator && role === 'listener' && handRaised && (
            <button onClick={() => toggleSpeech(p, 'grant')} className="mt-3 px-4 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-semibold hover:bg-green-500/40 transition">
              Дать слово
            </button>
          )}
          {!isOpenMic && isModerator && role === 'speaker' && p.identity !== localParticipant.identity && (
             <button onClick={() => toggleSpeech(p, 'revoke')} className="mt-3 px-4 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-semibold hover:bg-red-500/40 transition">
              Глушить
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-12 w-full max-w-5xl mx-auto h-full">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(16px, 4vw, 32px)', justifyContent: 'center', alignContent: 'center', flex: 1 }}>
        {speakers.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <i className="fas fa-microphone-lines" style={{ fontSize: '3rem', opacity: 0.2 }} />
            <span>Ожидание спикеров...</span>
          </div>
        ) : speakers.map(p => renderSpeaker(p, 'speaker'))}
      </div>

      {listeners.length > 0 && (
        <div className="mt-auto pt-8 border-t border-[rgba(255,255,255,0.05)] flex flex-col items-center shrink-0">
          <h3 className="mb-6 text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-center" style={{ letterSpacing: '0.1em' }}>
            Слушатели ({listeners.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center' }}>
             {listeners.map(p => renderSpeaker(p, 'listener'))}
          </div>
        </div>
      )}
    </div>
  );
}

function RoomControls({ isOpenMicProp, canPublishProp, isDeafened, setIsDeafened }: { isOpenMicProp?: boolean, canPublishProp?: boolean, isDeafened: boolean, setIsDeafened: (val: boolean) => void }) {
  const { localParticipant } = useLocalParticipant();
  const params = useParams();
  const roomId = params.uid as string;
  const canPublish = localParticipant.permissions?.canPublish ?? canPublishProp;
  const krisp = useRNNoiseFilter();
  
  const isMicOn = localParticipant.isMicrophoneEnabled;
  const isScreenSharing = localParticipant.isScreenShareEnabled;
  
  let meta: any = { isOpenMic: isOpenMicProp };
  if (localParticipant.metadata) {
    try { meta = JSON.parse(localParticipant.metadata); } catch(e) {}
  }
  
  const handRaised = meta.handRaised;

  const toggleHand = async () => {
    try {
      await fetch('/api/spaces/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          participantIdentity: localParticipant.identity,
          action: 'hand_toggle'
        })
      });
    } catch(e) { console.error('Failed to toggle hand via API', e); }
  };

  const handleDeafenToggle = () => {
    const nextState = !isDeafened;
    setIsDeafened(nextState);
    if (nextState && isMicOn) {
      localParticipant.setMicrophoneEnabled(false);
    }
  };
  
  const handleMicToggle = async () => {
    try {
      if (isDeafened) setIsDeafened(false); // Discord-like undeafen automatically
      await localParticipant.setMicrophoneEnabled(!isMicOn);
    } catch (e) {
      console.warn('Failed to toggle microphone', e);
    }
  };

  const handleScreenShareToggle = async () => {
    try {
      await localParticipant.setScreenShareEnabled(!isScreenSharing);
    } catch (e) {
      console.warn('Failed to toggle screen share', e);
    }
  };

  useEffect(() => {
    if (isMicOn && isDeafened) {
      setIsDeafened(false);
    }
  }, [isMicOn, isDeafened, setIsDeafened]);

  return (
    <div className="shrink-0 flex flex-col items-center justify-center w-full relative z-[5]" style={{ padding: '8px 20px 16px', background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', gap: 8 }}>
      <div className="glass-panel shadow-xl" style={{ padding: '8px 12px', borderRadius: 'var(--radius-full)', display: 'flex', gap: 'clamp(8px, 1.5vw, 16px)', border: '1px solid var(--border-subtle)', alignItems: 'center', background: 'rgba(25,25,30,0.8)', backdropFilter: 'blur(24px)' }}>
        
        {/* Deafen Button */}
        <button
          onClick={handleDeafenToggle}
          title={isDeafened ? "Включить наушники" : "Отключить динамики (Deafen)"}
          className="relative flex items-center justify-center transition-all overflow-hidden"
          style={{ 
            width: 48, height: 48, 
            borderRadius: '50%',
            background: isDeafened ? 'rgba(255, 76, 76, 0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${isDeafened ? 'rgba(255, 76, 76, 0.4)' : 'transparent'}`,
            color: isDeafened ? '#ff4c4c' : '#fff',
            boxShadow: isDeafened ? '0 0 15px rgba(255, 76, 76, 0.2)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (!isDeafened) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          }}
          onMouseLeave={(e) => {
            if (!isDeafened) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          }}
        >
          <i className="fas fa-headphones" style={{ fontSize: '1.2rem' }} />
          {isDeafened && (
             <div className="absolute w-[36px] h-[3px] bg-red-500 rotate-45 rounded-full" style={{ left: '6px', top: '22px', boxShadow: '0 0 5px rgba(0,0,0,0.5)' }} />
          )}
        </button>
        {/* Custom Microphone Button instead of ControlBar */}
        {canPublish ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleScreenShareToggle}
              title={isScreenSharing ? "Остановить стрим экрана" : "Показать экран"}
              className="relative flex items-center justify-center transition-all overflow-hidden"
              style={{ 
                width: 48, height: 48, 
                borderRadius: '50%',
                background: isScreenSharing ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isScreenSharing ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                color: isScreenSharing ? '#fff' : 'var(--text-secondary)',
                boxShadow: isScreenSharing ? '0 0 15px var(--accent-primary)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isScreenSharing) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                if (!isScreenSharing) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
            >
              <i className="fas fa-desktop" style={{ fontSize: '1.2rem' }} />
            </button>

            <button
              onClick={handleMicToggle}
              className="relative flex items-center justify-center transition-all overflow-hidden"
              style={{ 
                width: 56, height: 56, 
                borderRadius: '50%',
                background: !isMicOn ? 'rgba(255, 76, 76, 0.15)' : 'var(--accent-primary)',
                border: `1px solid ${!isMicOn ? 'rgba(255, 76, 76, 0.4)' : 'transparent'}`,
                color: !isMicOn ? '#ff4c4c' : '#fff',
                boxShadow: isMicOn ? '0 0 20px rgba(0, 150, 255, 0.4)' : '0 0 15px rgba(255, 76, 76, 0.2)'
              }}
            >
              <i className={`fas fa-microphone${!isMicOn ? '-slash' : ''}`} style={{ fontSize: '1.4rem' }} />
              {!isMicOn && (
                <div className="absolute w-[42px] h-[3px] bg-red-500 rotate-45 rounded-full" style={{ boxShadow: '0 0 5px rgba(0,0,0,0.5)' }} />
              )}
            </button>
          </div>
        ) : !meta.isOpenMic ? (
          <button 
            onClick={toggleHand}
            className="flex items-center justify-center transition-all"
            style={{ 
              width: 56, height: 56, borderRadius: '50%',
              background: handRaised ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
              color: '#fff', border: 'none', cursor: 'pointer',
              boxShadow: handRaised ? '0 0 20px color-mix(in srgb, var(--accent-primary) 50%, transparent)' : 'none'
            }}
          >
            <i className={`fas fa-hand-paper text-xl ${handRaised ? 'animate-bounce' : ''}`} />
          </button>
        ) : null}

        {/* Krisp wand */}
        {canPublish && (
          <button
            onClick={() => krisp.setNoiseFilterEnabled(!krisp.isNoiseFilterEnabled)}
            disabled={krisp.isNoiseFilterPending}
            title={krisp.isNoiseFilterEnabled ? "Выключить ИИ Шумоподавление" : "Включить ИИ Шумоподавление"}
            className="hidden md:flex items-center justify-center transition-all bg-[rgba(255,255,255,0.05)] text-white hover:bg-[rgba(255,255,255,0.1)] rounded-full"
            style={{ width: 48, height: 48, color: krisp.isNoiseFilterEnabled ? 'var(--accent-primary)' : '#fff', opacity: krisp.isNoiseFilterPending ? 0.5 : 1, border: krisp.isNoiseFilterEnabled ? '1px solid var(--accent-primary)' : '1px solid transparent' }}
          >
            {krisp.isNoiseFilterPending ? (
              <i className="fas fa-circle-notch fa-spin text-lg" />
            ) : (
              <i className={`fas fa-wand-magic-sparkles text-lg ${krisp.isNoiseFilterEnabled ? 'drop-shadow-[0_0_8px_var(--accent-primary)]' : ''}`} />
            )}
          </button>
        )}
      </div>
      
      {/* Active Mic Indicator */}
      {canPublish && (
        <div className="text-[0.7rem] text-center fade-in bg-[rgba(0,0,0,0.6)] px-4 py-1.5 rounded-full border border-[rgba(255,255,255,0.1)] uppercase font-semibold tracking-wider backdrop-blur-md" style={{ color: 'var(--text-secondary)' }}>
          <i className="fas fa-microphone-lines text-[var(--accent-primary)] mr-2" />
          {isMicOn ? 'Микрофон включен' : 'Вас не слышно'}
        </div>
      )}
    </div>
  );
}

function ScreenShareView() {
  const tracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }], 
    { onlySubscribed: false }
  );
  
  if (tracks.length === 0) return null;

  // Отрисовываем первый найденный стрим
  const trackRef = tracks[0];
  if (!trackRef.publication) return null;
  
  return (
    <div className="w-full relative glass-card p-2 md:p-3 mb-8 rounded-xl shadow-2xl overflow-hidden group border border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.4)]">
      <VideoTrack trackRef={trackRef as any} className="w-full h-auto max-h-[60vh] object-contain rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.5)]" style={{ background: '#000' }} />
      
      <div className="absolute top-4 left-4 bg-black/60 px-3 py-1.5 rounded-full text-white text-xs font-semibold backdrop-blur-md border border-[rgba(255,255,255,0.1)] flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(255,0,0,0.8)]" />
        {trackRef.participant.name || trackRef.participant.identity} запустил(а) стрим
      </div>
      
      <button 
        className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 p-3 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md border border-[rgba(255,255,255,0.1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] z-[10]"
        onClick={(e) => {
          const videoEl = e.currentTarget.parentElement?.querySelector('video');
          if (videoEl?.requestFullscreen) videoEl.requestFullscreen();
        }}
        title="На весь экран"
      >
        <i className="fas fa-expand text-lg" />
      </button>
    </div>
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
                   <img src={`/api/proxy-image?url=${encodeURIComponent(msg.message)}`} alt="GIF" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'cover' }} />
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
