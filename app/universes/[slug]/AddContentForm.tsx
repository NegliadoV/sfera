'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MarkdownBody } from '@/components/MarkdownBody';

type Props = { universeId: string; slug: string };

type ContentType = 'link' | 'article' | 'telegram';

export function AddContentForm({ universeId }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('link');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [body, setBody] = useState('');
  const [hasPoll, setHasPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pending, setPending] = useState(false);
  const [parsePending, setParsePending] = useState(false);
  const [error, setError] = useState('');

  const handleAddOption = () => {
    if (pollOptions.length < 4) setPollOptions([...pollOptions, '']);
  };

  const handleOptionChange = (index: number, val: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = val;
    setPollOptions(newOptions);
  };

  const handleParseTelegram = async () => {
    const raw = url.trim() || '';
    if (!raw) {
      setError('Вставьте ссылку на канал или пост Telegram (t.me/...)');
      return;
    }
    setParsePending(true);
    setError('');
    try {
      const res = await fetch('/api/parse-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url: raw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Не удалось загрузить данные');
        return;
      }
      if (data.title) setTitle(data.title);
      if (data.description) setBody(data.description);
      if (data.url) setUrl(data.url);
    } finally {
      setParsePending(false);
    }
  };

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (contentType === 'article' && !body.trim()) return;
    if (contentType === 'telegram' && !url.trim()) {
      setError('Укажите ссылку на канал или пост Telegram');
      return;
    }
    setPending(true);
    setError('');
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          universeId,
          type: contentType === 'telegram' ? 'link' : contentType,
          title: title.trim(),
          url: (contentType === 'link' || contentType === 'telegram') ? (url.trim() || undefined) : undefined,
          body: body.trim() || undefined,
          pollOptions: hasPoll ? pollOptions.filter(o => o.trim()) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Ошибка сохранения');
        return;
      }
      setTitle('');
      setUrl('');
      setBody('');
      setHasPoll(false);
      setPollOptions(['', '']);
      setIsOpen(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <div style={{ marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="add-content-form-open-btn"
          >
            <i className="fa-solid fa-plus" aria-hidden />
            Добавить материал
          </button>
        </div>
      )}
      {isOpen && (
        <form
          onSubmit={submit}
          className="content-block-mobile add-content-form add-content-form--open"
          style={{ marginBottom: '28px' }}
        >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <h2 className="add-content-form-title">
          <i className="fa-solid fa-file-plus" aria-hidden />
          Добавить материал
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="add-content-form-toggle">
            <button
              type="button"
              onClick={() => setContentType('link')}
              data-active={contentType === 'link'}
              aria-pressed={contentType === 'link'}
            >
              <i className="fa-solid fa-link" aria-hidden /> Ссылка
            </button>
            <button
              type="button"
              onClick={() => setContentType('telegram')}
              data-active={contentType === 'telegram'}
              aria-pressed={contentType === 'telegram'}
            >
              <i className="fa-brands fa-telegram" aria-hidden /> Telegram
            </button>
            <button
              type="button"
              onClick={() => setContentType('article')}
              data-active={contentType === 'article'}
              aria-pressed={contentType === 'article'}
            >
              <i className="fa-solid fa-file-alt" aria-hidden /> Статья
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setError('');
              setTitle('');
              setUrl('');
              setBody('');
              setHasPoll(false);
              setPollOptions(['', '']);
            }}
            className="add-content-form-close-btn"
            aria-label="Закрыть форму"
          >
            <i className="fa-solid fa-times" aria-hidden />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div className="add-content-form-field" style={{ flex: 1, minWidth: '240px' }}>
            <div className="add-content-form-input-wrap">
              <i className="fa-solid fa-pencil" aria-hidden />
              <input
                id="add-content-title"
                type="text"
                className="add-content-form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder=" "
                required
              />
              <label htmlFor="add-content-title" className="add-content-form-float-label">
                Название
              </label>
            </div>
          </div>
          {(contentType === 'link' || contentType === 'telegram') && (
            <div className="add-content-form-field" style={{ flex: 1, minWidth: '240px' }}>
              <div className="add-content-form-input-wrap">
                <i className={contentType === 'telegram' ? 'fa-brands fa-telegram' : 'fa-solid fa-globe'} aria-hidden />
                <input
                  id="add-content-url"
                  type="url"
                  className="add-content-form-input"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder=" "
                />
                <label htmlFor="add-content-url" className="add-content-form-float-label">
                  {contentType === 'telegram' ? 'Ссылка на канал или пост (t.me/...)' : 'Ссылка (необязательно)'}
                </label>
              </div>
              {contentType === 'telegram' && (
                <button
                  type="button"
                  onClick={handleParseTelegram}
                  disabled={parsePending || !url.trim()}
                  className="add-content-form-submit"
                  style={{ marginTop: 12, alignSelf: 'flex-start' }}
                >
                  <i className={`fa-solid ${parsePending ? 'fa-spinner fa-pulse' : 'fa-download'}`} aria-hidden />
                  {parsePending ? 'Загрузка…' : 'Загрузить данные из Telegram'}
                </button>
              )}
            </div>
          )}
        </div>

        {(contentType === 'link' || contentType === 'telegram') && (
          <div className="add-content-form-field" style={{ minWidth: '100%' }}>
            <div className="add-content-form-input-wrap add-content-form-input-wrap--textarea">
              <i className="fa-solid fa-pen" aria-hidden />
              <textarea
                id="add-content-desc"
                className="add-content-form-textarea"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onPaste={handlePaste}
                placeholder=" "
                rows={2}
              />
              <label htmlFor="add-content-desc" className="add-content-form-float-label">
                {contentType === 'telegram' ? 'Описание (поддерживает Markdown)' : 'Описание (необязательно, поддерживает Markdown)'}
              </label>
            </div>
          </div>
        )}

        {contentType === 'article' && (
          <div className="add-content-form-field add-content-form-field--no-float" style={{ minWidth: '100%' }}>
            <label className="add-content-form-label">
              <i className="fa-solid fa-align-left" aria-hidden />
              Текст статьи
            </label>
            <div className="add-content-form-editor-wrap">
              <div className="add-content-form-editor-panel">
                <div className="add-content-form-editor-panel-header">Редактор</div>
                <textarea
                  className="add-content-form-textarea add-content-form-textarea-editor"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Напишите статью в Markdown…"
                  rows={16}
                  required
                />
              </div>
              <div className="add-content-form-editor-panel add-content-form-preview-wrap">
                <div className="add-content-form-editor-panel-header" style={{ position: 'sticky', top: 0, zIndex: 10 }}>Превью</div>
                <div style={{ padding: '16px', minHeight: 280 }}>
                  {body.trim() ? (
                    <MarkdownBody content={body} />
                  ) : (
                    <p className="add-content-form-preview-placeholder">
                      Превью появится здесь при вводе текста.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}


        <div className="add-content-form-field" style={{ minWidth: '100%' }}>
           <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 500, color: 'var(--text-primary)' }}>
             <input type="checkbox" checked={hasPoll} onChange={(e) => setHasPoll(e.target.checked)} className="form-checkbox h-5 w-5 text-[var(--accent-primary)] rounded bg-white/5 border-white/20" />
             <i className="fa-solid fa-chart-pie text-[var(--accent-primary)]"></i> Прикрепить опрос
           </label>

           {hasPoll && (
             <div className="mt-4 flex flex-col gap-3 p-4 rounded-xl bg-[color-mix(in_srgb,var(--accent-primary)_5%,transparent)] border border-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)]">
               {pollOptions.map((opt, idx) => (
                 <div key={idx} className="flex gap-2 w-full">
                   <input
                     type="text"
                     placeholder={`Опция ${idx + 1}`}
                     value={opt}
                     onChange={(e) => handleOptionChange(idx, e.target.value)}
                     className="add-content-form-input w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2"
                     required={idx < 2} // first two options are required
                     maxLength={100}
                   />
                   {idx > 1 && (
                     <button type="button" onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))} className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                       <i className="fa-solid fa-trash"></i>
                     </button>
                   )}
                 </div>
               ))}
               {pollOptions.length < 4 && (
                 <button type="button" onClick={handleAddOption} className="text-sm font-medium px-4 py-2 mt-2 rounded-lg border border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white transition self-start">
                   <i className="fa-solid fa-plus mr-2"></i> Добавить опцию (max 4)
                 </button>
               )}
             </div>
           )}
        </div>

        {error && <div className="add-content-form-error">{error}</div>}

        <div className="add-content-form-actions">
          <button
            type="submit"
            disabled={pending || !title.trim() || (contentType === 'article' && !body.trim()) || (contentType === 'telegram' && !url.trim())}
            className="add-content-form-submit"
          >
            <i className={`fa-solid ${pending ? 'fa-spinner fa-pulse' : 'fa-plus'}`} aria-hidden />
            {pending ? 'Добавление…' : 'Добавить'}
          </button>
        </div>
      </div>
    </form>
      )}
    </>
  );
}
