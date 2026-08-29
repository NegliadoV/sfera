'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useTranslation } from '@/components/i18n/LanguageProvider';

const RichArticleEditor = dynamic(
  () => import('@/components/content/RichArticleEditor').then((mod) => mod.RichArticleEditor),
  {
    ssr: false,
    loading: () => (
      <div className="rich-editor-root" style={{ minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }} />
        <span>Загрузка редактора…</span>
      </div>
    ),
  }
);

type Props = { universeId: string; slug: string };

type ContentType = 'link' | 'article' | 'telegram';

export function AddContentForm({ universeId, slug }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
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

  // Восстановление состояния формы и черновиков при загрузке
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedOpen = localStorage.getItem(`draft_form_open_${slug}`);
    const savedType = localStorage.getItem(`draft_type_${slug}`) as ContentType | null;
    const savedTitle = localStorage.getItem(`draft_title_${slug}`);
    const savedUrl = localStorage.getItem(`draft_url_${slug}`);
    const savedBody = localStorage.getItem(`draft_body_${slug}`);
    const hasArticleDraft =
      !!localStorage.getItem(`draft_article_${slug}`) ||
      !!localStorage.getItem(`draft_article_${slug}_json`);

    if (savedOpen === '1' || hasArticleDraft || savedTitle) {
      setIsOpen(true);
    }
    if (savedType && ['link', 'article', 'telegram'].includes(savedType)) {
      setContentType(savedType);
    } else if (hasArticleDraft) {
      setContentType('article');
    }
    if (savedTitle) setTitle(savedTitle);
    if (savedUrl) setUrl(savedUrl);
    if (savedBody && savedType !== 'article') setBody(savedBody);
  }, [slug]);

  // Сохранение состояния формы при изменениях
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isOpen) {
      localStorage.setItem(`draft_form_open_${slug}`, '1');
    } else {
      localStorage.removeItem(`draft_form_open_${slug}`);
    }
  }, [isOpen, slug]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`draft_type_${slug}`, contentType);
  }, [contentType, slug]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (title) {
      localStorage.setItem(`draft_title_${slug}`, title);
    } else {
      localStorage.removeItem(`draft_title_${slug}`);
    }
  }, [title, slug]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (url) {
      localStorage.setItem(`draft_url_${slug}`, url);
    } else {
      localStorage.removeItem(`draft_url_${slug}`);
    }
  }, [url, slug]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (contentType !== 'article') {
      if (body) {
        localStorage.setItem(`draft_body_${slug}`, body);
      } else {
        localStorage.removeItem(`draft_body_${slug}`);
      }
    }
  }, [body, contentType, slug]);

  const clearAllDrafts = () => {
    localStorage.removeItem(`draft_form_open_${slug}`);
    localStorage.removeItem(`draft_type_${slug}`);
    localStorage.removeItem(`draft_title_${slug}`);
    localStorage.removeItem(`draft_url_${slug}`);
    localStorage.removeItem(`draft_body_${slug}`);
    localStorage.removeItem(`draft_article_${slug}`);
    localStorage.removeItem(`draft_article_${slug}_json`);
  };

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
        setError(data.botMessage || data.error || 'Ошибка сохранения');
        return;
      }
      setTitle('');
      setUrl('');
      setBody('');
      setHasPoll(false);
      setPollOptions(['', '']);
      setIsOpen(false);
      // Очищаем черновики после успешной отправки
      clearAllDrafts();
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
            {t('rooms.addMaterial', 'Добавить материал')}
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
          {t('rooms.addMaterial', 'Добавить материал')}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="add-content-form-toggle">
            <button
              type="button"
              onClick={() => setContentType('link')}
              data-active={contentType === 'link'}
              aria-pressed={contentType === 'link'}
            >
              <i className="fa-solid fa-link" aria-hidden /> {t('content.typeLink', 'Ссылка')}
            </button>
            <button
              type="button"
              onClick={() => setContentType('telegram')}
              data-active={contentType === 'telegram'}
              aria-pressed={contentType === 'telegram'}
            >
              <i className="fa-brands fa-telegram" aria-hidden /> {t('content.typeTelegram', 'Telegram')}
            </button>
            <button
              type="button"
              onClick={() => setContentType('article')}
              data-active={contentType === 'article'}
              aria-pressed={contentType === 'article'}
            >
              <i className="fa-solid fa-file-alt" aria-hidden /> {t('content.typeArticle', 'Статья')}
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
              clearAllDrafts();
            }}
            className="add-content-form-close-btn"
            aria-label={t('common.close', 'Закрыть')}
          >
            <i className="fa-solid fa-xmark" aria-hidden />
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
                {t('content.materialTitle', 'Название')}
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
                  {contentType === 'telegram' ? 'Telegram (t.me/...)' : t('content.url', 'Ссылка на источник')}
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
                  {parsePending ? t('common.loading', 'Загрузка…') : 'Telegram'}
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
                {t('content.body', 'Описание (поддерживает Markdown)')}
              </label>
            </div>
          </div>
        )}

        {contentType === 'article' && (
          <div className="add-content-form-field add-content-form-field--no-float" style={{ minWidth: '100%' }}>
            <RichArticleEditor value={body} onChange={setBody} draftKey={`draft_article_${slug}`} />
          </div>
        )}


        <div className="add-content-form-field" style={{ minWidth: '100%' }}>
           <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 500, color: 'var(--text-primary)' }}>
             <input type="checkbox" checked={hasPoll} onChange={(e) => setHasPoll(e.target.checked)} className="form-checkbox h-5 w-5 text-[var(--accent-primary)] rounded bg-white/5 border-white/20" />
             <i className="fa-solid fa-chart-pie text-[var(--accent-primary)]"></i> {t('content.addPoll', 'Прикрепить опрос')}
           </label>

           {hasPoll && (
             <div className="mt-4 flex flex-col gap-3 p-4 rounded-xl bg-[color-mix(in_srgb,var(--accent-primary)_5%,transparent)] border border-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)]">
               {pollOptions.map((opt, idx) => (
                 <div key={idx} className="flex gap-2 w-full">
                   <input
                     type="text"
                     placeholder={`${t('content.pollOption', 'Опция')} ${idx + 1}`}
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
                   <i className="fa-solid fa-plus mr-2"></i> {t('content.addOption', '+ Добавить вариант')} (max 4)
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
            {pending ? t('common.saving', 'Добавление…') : t('common.submit', 'Добавить')}
          </button>
        </div>
      </div>
    </form>
      )}
    </>
  );
}

