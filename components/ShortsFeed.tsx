'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';

type Short = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  viewsCount: number;
  likesCount: number;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    userTag: string | null;
  };
};

function ShortVideo({ short, isActive, myCrystals, setMyCrystals }: { short: Short; isActive: boolean; myCrystals: number; setMyCrystals: React.Dispatch<React.SetStateAction<number>> }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDonationAnim, setShowDonationAnim] = useState(false);

  useEffect(() => {
    if (isActive) {
      videoRef.current?.play().then(() => setIsPlaying(true)).catch(e => console.error("Autoplay failed:", e));
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    }
  }, [isActive]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleDonate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (myCrystals < 10) {
      alert('Недостаточно кристаллов! Пополните баланс 💎');
      return;
    }
    const amount = 10;
    
    // Optimistic
    setMyCrystals(prev => prev - amount);
    
    try {
      const res = await fetch('/api/crystals/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: short.author.id, amount, shortId: short.id })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Ошибка перевода');
        setMyCrystals(prev => prev + amount); // Rollback
      } else {
        setShowDonationAnim(true);
        setTimeout(() => setShowDonationAnim(false), 2000);
      }
    } catch {
      alert('Сетевая ошибка');
      setMyCrystals(prev => prev + amount);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black snap-start">
      <video
        ref={videoRef}
        src={short.videoUrl}
        loop
        playsInline
        onClick={togglePlay}
        className="object-cover w-full h-full md:w-auto md:max-w-[480px] cursor-pointer"
      />
      
      {/* Play/Pause indicator logic */}
      {!isPlaying && isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/50 rounded-full w-20 h-20 flex items-center justify-center">
             <i className="fas fa-play text-white text-3xl ml-2"></i>
          </div>
        </div>
      )}

      {/* Donation Success Animation */}
      {showDonationAnim && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 animate-in zoom-in duration-500 fade-in slide-in-from-bottom-10">
          <div className="flex flex-col items-center animate-bounce">
            <i className="fas fa-gem text-6xl text-cyan-400 drop-shadow-[0_0_40px_rgba(34,211,238,1)]"></i>
            <span className="text-white text-2xl font-bold mt-4 drop-shadow-lg">+10 Автору!</span>
          </div>
        </div>
      )}

      {/* Overlay UI */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col gap-3 justify-end h-1/2 pointer-events-none">
        
        <div className="max-w-[480px] mx-auto w-full flex flex-col gap-3 pb-4 pointer-events-auto pr-16">
          <div className="flex flex-col text-white">
            <h3 className="font-bold text-lg md:text-xl drop-shadow-md">{short.title}</h3>
            {short.description && <p className="text-sm opacity-90 line-clamp-2 md:line-clamp-3 mt-1 drop-shadow-md">{short.description}</p>}
          </div>

          <div className="flex items-center gap-3 text-white">
            {short.author.image ? (
              <img src={short.author.image} alt="" className="h-10 w-10 border border-white/30 shadow-lg" style={{ borderRadius: '10px', objectFit: 'cover' }} />
            ) : (
              <div className="h-10 w-10 border border-white/30 shadow-lg bg-white/10 flex items-center justify-center font-bold text-lg" style={{ borderRadius: '10px' }}>
                {short.author.name?.slice(0, 1)?.toUpperCase() || '?'}
              </div>
            )}
            <div className="flex flex-col">
               <span className="font-semibold text-sm drop-shadow-md">{short.author.name}</span>
               <span className="text-xs opacity-80 drop-shadow-md">@{short.author.userTag || short.author.id.slice(0,5)}</span>
            </div>
            <button className="ml-2 px-3 py-1 rounded-full border border-white/30 bg-white/10 text-xs font-semibold backdrop-blur-md">
              Подписаться
            </button>
          </div>
        </div>
      </div>

      {/* Right side actions */}
      <div className="absolute right-2 md:right-4 bottom-24 flex flex-col gap-4 justify-end items-end pointer-events-none z-10 w-16">
        <div className="pointer-events-auto flex flex-col items-center gap-1">
          <button className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition hover:scale-110 border border-white/10 shadow-lg">
            <i className="fas fa-heart text-xl"></i>
          </button>
          <span className="text-white text-xs font-bold drop-shadow-md">{short.likesCount}</span>
        </div>

        <div className="pointer-events-auto flex flex-col items-center gap-1">
          <button className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition hover:scale-110 border border-white/10 shadow-lg">
            <i className="fas fa-comment text-xl"></i>
          </button>
          <span className="text-white text-xs font-bold drop-shadow-md">0</span>
        </div>

        <div className="pointer-events-auto flex flex-col items-center gap-1">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(`${window.location.origin}/shorts/${short.id}`);
              alert('Ссылка на это видео скопирована! 🚀');
            }}
            className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition hover:scale-110 border border-white/10 shadow-lg relative"
          >
            <i className="fas fa-share text-xl"></i>
          </button>
          <span className="text-white text-xs font-bold drop-shadow-md">Share</span>
        </div>

        <div className="pointer-events-auto flex flex-col items-center gap-1 mt-2">
          <button 
            onClick={handleDonate}
            title={myCrystals >= 10 ? `Отправить 10 💎\nВаш баланс: ${myCrystals}` : 'Недостаточно 💎'}
            className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition hover:scale-110 border border-white/10 shadow-[0_0_15px_rgba(34,211,238,0.4)] relative"
          >
            <i className="fas fa-gem text-xl text-cyan-400"></i>
          </button>
          <span className="text-white text-xs font-bold drop-shadow-md cursor-help" title={`Ваш баланс: ${myCrystals} 💎`}>{myCrystals} 💎</span>
        </div>
      </div>
    </div>
  );
}

export function ShortsFeed() {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [myCrystals, setMyCrystals] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. SWR: Load from cache instantly
    const cached = localStorage.getItem('sfera_shorts_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) {
          setShorts(parsed);
          setLoading(false);
        }
      } catch {}
    }

    // 2. SWR: Fetch fresh data
    fetch('/api/shorts')
      .then(res => res.json())
      .then(data => {
        if (data.shorts) {
          setShorts(data.shorts);
          localStorage.setItem('sfera_shorts_cache', JSON.stringify(data.shorts));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load shorts", err);
        setLoading(false);
      });

    fetch('/api/me/crystals')
      .then(res => res.json())
      .then(data => {
        if (data.balance !== undefined) setMyCrystals(data.balance);
      })
      .catch(() => {});
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const height = container.clientHeight;
    const newIndex = Math.round(scrollTop / height);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < shorts.length) {
      setActiveIndex(newIndex);
    }
  }, [activeIndex, shorts.length]);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-white/50 w-full animate-pulse"><i className="fas fa-spinner fa-spin text-3xl"></i></div>;
  }

  if (shorts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white text-center p-4">
        <div className="text-4xl mb-4 opacity-50"><i className="fas fa-video-slash"></i></div>
        <div className="text-2xl font-bold mb-2">Здесь пока пусто</div>
        <div className="opacity-70 mb-6 max-w-sm">Будьте первым, кто поделится короткой образовательной лекцией!</div>
        <Link href="/shorts/upload" className="platform-btn platform-btn-primary hover:scale-105">
          <i className="fas fa-plus"></i> Загрузить первое видео
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth relative no-scrollbar"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
      
      {shorts.map((short, idx) => (
        <ShortVideo key={short.id} short={short} isActive={idx === activeIndex} myCrystals={myCrystals} setMyCrystals={setMyCrystals} />
      ))}
    </div>
  );
}
