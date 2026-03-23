'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EditContentFormProps {
  contentId: string;
  slug: string;
  initialTitle: string;
  initialBody: string | null;
  initialUrl: string | null;
}

export function EditContentForm({
  contentId,
  slug,
  initialTitle,
  initialBody,
  initialUrl,
}: EditContentFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody ?? '');
  const [url, setUrl] = useState(initialUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (!file) continue;
        e.preventDefault();
        
        const placeholder = `![Загрузка...]()\n`;
        const start = e.currentTarget.selectionStart;
        const end = e.currentTarget.selectionEnd;
        setBody(prev => prev.substring(0, start) + placeholder + prev.substring(end));
        
        const fd = new FormData();
        fd.append('file', file);
        try {
          const res = await fetch('/api/me/chat-upload', { method: 'POST', credentials: 'include', body: fd });
          const data = await res.json();
          if (res.ok && data.url) {
            setBody((prev) => prev.replace(placeholder, `![Скриншот](${data.url})\n`));
          } else {
            setBody((prev) => prev.replace(placeholder, `*[Ошибка загрузки]*\n`));
          }
        } catch {
          setBody((prev) => prev.replace(placeholder, `*[Ошибка загрузки]*\n`));
        }
        break;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/content/${contentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() || undefined, body: body.trim() || undefined, url: url.trim() || undefined }),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? 'Ошибка сохранения');
        return;
      }
      router.refresh();
      router.replace(`/universes/${slug}/content/${contentId}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="platform-card mb-6 p-4">
      <h2 className="text-lg font-semibold mb-4">Редактировать пост</h2>
      {error && (
        <p className="text-red-500 text-sm mb-4" role="alert">
          {error}
        </p>
      )}
      <div className="mb-4">
        <label htmlFor="edit-title" className="block text-sm font-medium mb-1">
          Заголовок
        </label>
        <input
          id="edit-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded border bg-transparent"
          style={{ borderColor: 'var(--border-color)' }}
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="edit-url" className="block text-sm font-medium mb-1">
          Ссылка
        </label>
        <input
          id="edit-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-3 py-2 rounded border bg-transparent"
          style={{ borderColor: 'var(--border-color)' }}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="edit-body" className="block text-sm font-medium mb-1">
          Текст
        </label>
        <textarea
          id="edit-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onPaste={handlePaste}
          rows={6}
          className="w-full px-3 py-2 rounded border bg-transparent resize-y"
          style={{ borderColor: 'var(--border-color)' }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="platform-btn platform-btn-primary"
        >
          {saving ? 'Сохранение…' : 'Сохранить'}
        </button>
        <button
          type="button"
          onClick={() => router.replace(`/universes/${slug}/content/${contentId}`)}
          disabled={saving}
          className="platform-btn platform-btn-sm"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
