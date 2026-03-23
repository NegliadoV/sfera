'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';

export default function ShortsUploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title);
    if (description) formData.append('description', description);

    try {
      const res = await fetch('/api/shorts', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        router.push('/shorts');
        router.refresh(); // Refresh to catch the new feed
      } else {
        const err = await res.json();
        alert('Ошибка при загрузке: ' + (err.error || 'Unknown'));
      }
    } catch (error) {
      console.error(error);
      alert('Ошибка при загрузке');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-12 platform-card mt-8 animate-in fade-in slide-in-from-bottom-6">
      <h1 className="text-3xl font-bold mb-8">Загрузка Шортс</h1>
      
      <form onSubmit={handleUpload} className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
            Видео (MP4, MOV)
          </label>
          <div className="border-2 border-dashed border-[var(--border-color)] rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-[var(--hover-color)] transition-colors cursor-pointer relative overflow-hidden">
             
            <input 
              type="file" 
              accept="video/mp4,video/quicktime" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={e => setFile(e.target.files?.[0] || null)}
              required
            />
            {file ? (
              <div className="text-[var(--accent-primary)] font-medium flex items-center gap-2">
                <i className="fas fa-video"></i> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            ) : (
              <div className="text-[var(--studio-meta-color)] flex flex-col items-center">
                <i className="fas fa-cloud-upload-alt text-4xl mb-4"></i>
                <span className="font-medium text-[var(--text-primary)]">Нажмите или перетащите файл</span>
                <span className="text-sm mt-1">До 100 МБ, вертикальное (16:9)</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
            Название (Обязательно)
          </label>
          <input 
            type="text" 
            placeholder="О чем это видео?" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-[var(--bg-accent)] border border-[var(--border-color)] p-4 rounded-xl focus:outline-none text-base sm:text-sm focus:border-[var(--accent-primary)] transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
            Описание (Необязательно)
          </label>
          <textarea 
            placeholder="Добавьте полезные ссылки, таймкоды или пояснения" 
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-[var(--bg-accent)] border border-[var(--border-color)] p-4 rounded-xl focus:outline-none text-base sm:text-sm focus:border-[var(--accent-primary)] transition-colors min-h-[120px]"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || !file || !title}
          className={`${buttonVariants({ variant: 'default' })} w-full py-6 text-lg rounded-xl mt-4 ${loading ? 'opacity-70' : ''}`}
        >
          {loading ? (
            <><i className="fas fa-spinner fa-spin mr-2"></i> Загрузка...</>
          ) : (
            <><i className="fas fa-paper-plane mr-2"></i> Опубликовать Шортс</>
          )}
        </button>
      </form>
    </div>
  );
}
