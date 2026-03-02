'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EditContentFormProps {
  contentId: string;
  slug: string;
  initialTitle: string;
  initialBody: string | null;
  initialUrl: string | null;
  onCancel: () => void;
}

export function EditContentForm({
  contentId,
  slug,
  initialTitle,
  initialBody,
  initialUrl,
  onCancel,
}: EditContentFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody ?? '');
  const [url, setUrl] = useState(initialUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          onClick={() => {
            onCancel();
            router.replace(`/universes/${slug}/content/${contentId}`);
          }}
          disabled={saving}
          className="platform-btn platform-btn-sm"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
