'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MarkdownBody } from '@/components/MarkdownBody';
import { ContentPoll } from '@/components/ContentPoll';
import { ContentCard } from './ContentCard';

export function ContentFeedGrid({ items, slug, canDelete = false, canEdit = false, canPin = false, layout = 'grid' }: {
  items: any[];
  slug: string;
  canDelete?: boolean;
  canEdit?: boolean;
  canPin?: boolean;
  layout?: 'grid' | 'list';
}) {
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);
  const [isAddingToMap, setIsAddingToMap] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Real-time updates: poll the server component every 10s if modal is closed
  useEffect(() => {
    if (activeModalIndex !== null) return;
    
    const interval = setInterval(() => {
      router.refresh();
    }, 10000); // 10s polling for real-time news
    
    return () => clearInterval(interval);
  }, [activeModalIndex, router]);

  // Scroll to active index when modal opens
  useEffect(() => {
    if (activeModalIndex !== null && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const targetElement = container.children[activeModalIndex] as HTMLElement;
      if (targetElement) {
        container.scrollTop = targetElement.offsetTop;
      }
    }
  }, [activeModalIndex]);

  const handleAddToMap = async (item: any) => {
    setIsAddingToMap(item.id);
    try {
      const res = await fetch('/api/me/mind-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Конспект: ${item.title}` })
      });
      if (res.ok) {
        const map = await res.json();
        
        const newNode = {
          id: crypto.randomUUID(),
          type: 'post',
          position: { x: 250, y: 150 },
          data: { contentId: item.id, bgColor: 'rgba(20, 20, 25, 0.8)' }
        };
        
        await fetch(`/api/me/mind-maps/${map.id}/sync`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodes: [newNode], edges: [] })
        });
        
        // Track the save event for gamification!
        await fetch(`/api/content/${item.id}/save`, { method: 'POST' });

        router.push(`/me/mind-maps/${map.id}`);
      }
    } catch (e) {
      console.error(e);
      alert("Не удалось создать Карту");
    } finally {
      setIsAddingToMap(null);
    }
  };

  return (
    <>
      {layout === 'grid' && (
        <div className="platform-card-desc mb-4">
          Закреплённые посты отображаются сверху.
        </div>
      )}
      <div className={layout === 'grid' ? "columns-1 md:columns-2 xl:columns-3 gap-4 md:gap-6" : "flex flex-col gap-2 items-start"}>
        {items.map((c, idx) => (
          <div key={c.id} className="break-inside-avoid mb-4 md:mb-6">
            <ContentCard
              {...c}
              slug={c.universeSlug || slug}
              canDelete={canDelete}
              canEdit={canEdit}
              canPin={canPin}
              onOpenModal={() => setActiveModalIndex(idx)}
            />
          </div>
        ))}
      </div>

      {activeModalIndex !== null && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex flex-col bg-[#0b0d13]/95 backdrop-blur-3xl animate-in fade-in duration-300">
           {/* Global Close Button */}
           <button 
              onClick={() => setActiveModalIndex(null)} 
              className="absolute top-4 right-4 md:top-8 md:right-8 z-[100000] w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition hover:scale-110 shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/10"
           >
              <i className="fas fa-times text-xl"></i>
           </button>

           {/* Shorts Feed Container */}
           <div 
             ref={scrollContainerRef}
             className="w-full h-full overflow-y-auto overscroll-contain snap-y snap-mandatory scroll-smooth no-scrollbar"
             style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
           >
             <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar { display: none; }` }} />
             
             {items.map((item) => {
               const displayDate = item.publishedAt ? new Date(item.publishedAt) : new Date(item.createdAt);
               const displayAuthor = item.externalAuthor || item.authorName || 'Участник';
               
               return (
                 <div key={item.id} className="w-full min-h-[100vh] snap-start shrink-0 flex flex-col items-center relative py-20 px-4 md:px-0 border-b border-white/5 last:border-0">
                    <div className="w-full max-w-[640px] flex flex-col gap-6 relative z-10">
                       <div className="flex flex-col drop-shadow-md mb-2">
                          <div className="text-white/80 font-medium text-sm">{displayAuthor}</div>
                          <div className="text-[var(--text-meta)] text-xs">{displayDate.toLocaleDateString('ru', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                       </div>
                       
                       <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight drop-shadow-md">{item.title}</h1>
                       
                       {item.imageUrl && (
                         <div className="w-full mt-2 mb-4">
                           <img src={item.imageUrl} alt="" className="w-full rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] object-cover max-h-[60vh] border border-white/10" />
                         </div>
                       )}

                       {item.body && (
                         <div className="text-white/90 prose prose-invert prose-lg max-w-none leading-relaxed drop-shadow-sm mb-8">
                           <MarkdownBody content={item.body} />
                         </div>
                       )}

                       {item.pollData && (
                         <div className="w-full max-w-[640px] mb-8">
                           <ContentPoll pollId={item.pollData.id} options={item.pollData.options as any} />
                         </div>
                       )}
                       {item.url && (
                         <a href={item.url} target="_blank" rel="noreferrer" className="text-[var(--accent-primary)] hover:underline break-all p-4 rounded-xl bg-white/5 border border-white/10 inline-block mb-12">
                            {item.url}
                         </a>
                       )}

                       {/* Discussion Button */}
                       <div className="w-full mt-4 flex flex-col md:flex-row justify-center gap-4 pb-24">
                          <Link href={`/universes/${item.universeSlug || slug}/content/${item.id}#discussion`} onClick={() => setActiveModalIndex(null)} className="w-full max-w-xs shadow-[0_0_30px_rgba(var(--accent-primary-rgb, 139,92,246), 0.4)] px-6 py-4 rounded-2xl bg-[var(--accent-primary)] hover:brightness-110 text-white text-center font-bold transition flex items-center justify-center gap-3">
                             <i className="fa-solid fa-comments text-lg"></i>
                             Обсуждение
                          </Link>
                          
                          <button 
                            onClick={() => handleAddToMap(item)} 
                            disabled={isAddingToMap === item.id}
                            className={`w-full max-w-xs shadow-[0_0_30px_rgba(33,150,243,0.4)] px-6 py-4 rounded-2xl bg-[#2196f3] hover:brightness-110 text-white text-center font-bold transition flex items-center justify-center gap-3 ${isAddingToMap === item.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                          >
                             {isAddingToMap === item.id ? (
                               <i className="fa-solid fa-spinner fa-spin text-lg"></i>
                             ) : (
                               <i className="fa-solid fa-project-diagram text-lg"></i>
                             )}
                             В Личную Карту
                          </button>
                       </div>
                    </div>
                 </div>
               );
             })}
           </div>
        </div>,
        document.body
      )}
    </>
  );
}
