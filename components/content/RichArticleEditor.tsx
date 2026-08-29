'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { createLowlight, common } from 'lowlight';
import { MarkdownBody } from '@/components/MarkdownBody';
import { useTranslation } from '@/components/i18n/LanguageProvider';

const lowlight = createLowlight(common);

// Markdown serialiser — converts Tiptap doc to Markdown string for storage
function tiptapToMarkdown(editor: any): string {
  const json = editor.getJSON();
  return nodesToMd(json);
}

function nodesToMd(node: any): string {
  if (!node) return '';
  if (node.type === 'doc') return (node.content || []).map(nodesToMd).join('\n');
  if (node.type === 'paragraph') {
    const text = (node.content || []).map(nodesToMd).join('');
    return text ? text + '\n' : '\n';
  }
  if (node.type === 'heading') {
    const text = (node.content || []).map(nodesToMd).join('');
    return '#'.repeat(node.attrs?.level || 1) + ' ' + text + '\n';
  }
  if (node.type === 'text') {
    let t = node.text || '';
    const marks: string[] = (node.marks || []).map((m: any) => m.type);
    if (marks.includes('bold') && marks.includes('italic')) return `***${t}***`;
    if (marks.includes('bold')) return `**${t}**`;
    if (marks.includes('italic')) return `*${t}*`;
    if (marks.includes('strike')) return `~~${t}~~`;
    if (marks.includes('code')) return `\`${t}\``;
    return t;
  }
  if (node.type === 'bulletList') {
    return (node.content || []).map((li: any) => `- ${nodesToMd(li).trim()}`).join('\n') + '\n';
  }
  if (node.type === 'orderedList') {
    return (node.content || []).map((li: any, i: number) => `${i + 1}. ${nodesToMd(li).trim()}`).join('\n') + '\n';
  }
  if (node.type === 'listItem') {
    return (node.content || []).map(nodesToMd).join('');
  }
  if (node.type === 'blockquote') {
    const inner = (node.content || []).map(nodesToMd).join('');
    return inner.split('\n').map((l: string) => `> ${l}`).join('\n') + '\n';
  }
  if (node.type === 'codeBlock') {
    const lang = node.attrs?.language || '';
    const code = (node.content || []).map((c: any) => c.text || '').join('');
    return `\`\`\`${lang}\n${code}\n\`\`\`\n`;
  }
  if (node.type === 'horizontalRule') {
    return '\n---\n';
  }
  if (node.type === 'image') {
    const alt = node.attrs?.alt || '';
    const src = node.attrs?.src || '';
    return `![${alt}](${src})\n`;
  }
  if (node.type === 'youtube') {
    const src = node.attrs?.src || '';
    return `\n::video[${src}]\n`;
  }
  return '';
}

const CODE_LANGUAGES = [
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Python',     value: 'python' },
  { label: 'Rust',       value: 'rust' },
  { label: 'Go',         value: 'go' },
  { label: 'HTML/CSS',   value: 'html' },
  { label: 'JSON',       value: 'json' },
  { label: 'SQL',        value: 'sql' },
  { label: 'Bash',       value: 'bash' },
  { label: 'Plain Text', value: 'plaintext' },
];

interface Props {
  value: string;
  onChange: (v: string) => void;
  draftKey?: string;
}

export function RichArticleEditor({ value, onChange, draftKey }: Props) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [showCodePicker, setShowCodePicker] = useState(false);
  const [showVideoPicker, setShowVideoPicker] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [, forceUpdate] = useState(0);
  const [bubblePos, setBubblePos] = useState<{ x: number; y: number } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorWrapRef = useRef<HTMLDivElement>(null);
  const videoUrlInputRef = useRef<HTMLInputElement>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const codeBtnRef = useRef<HTMLButtonElement>(null);
  const videoBtnRef = useRef<HTMLButtonElement>(null);
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number } | null>(null);
  const [videoPickerPos, setVideoPickerPos] = useState<{ top: number; left: number } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({ lowlight }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
      }),
      Youtube.configure({
        inline: false,
        nocookie: false,
        allowFullscreen: true,
      }),
      Placeholder.configure({
        placeholder: t('content.bodyPlaceholder', 'Начните писать статью…'),
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor: ed }) => {
      forceUpdate((n) => n + 1);
      const md = tiptapToMarkdown(ed);
      onChange(md);

      if (draftKey) {
        setSaveStatus('saving');
        if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        autosaveTimer.current = setTimeout(() => {
          try {
            localStorage.setItem(draftKey, md);
            localStorage.setItem(draftKey + '_json', JSON.stringify(ed.getJSON()));
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2500);
          } catch {}
        }, 600);
      }
    },
    onSelectionUpdate: ({ editor: ed }) => {
      const { from, to, empty } = ed.state.selection;
      if (empty || from === to) {
        setBubblePos(null);
        return;
      }
      try {
        const { view } = ed;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);
        const wrapRect = editorWrapRef.current?.getBoundingClientRect();
        if (wrapRect) {
          setBubblePos({
            x: (start.left + end.right) / 2 - wrapRect.left,
            y: start.top - wrapRect.top - 44,
          });
        }
      } catch {
        setBubblePos(null);
      }
    },
  });

  const [draftRestored, setDraftRestored] = useState(false);
  const initialRestored = useRef(false);

  useEffect(() => {
    if (!editor || initialRestored.current) return;
    initialRestored.current = true;

    if (draftKey) {
      try {
        const savedJson = localStorage.getItem(draftKey + '_json');
        if (savedJson) {
          const parsed = JSON.parse(savedJson);
          editor.commands.setContent(parsed);
          setDraftRestored(true);
          return;
        }
        const savedMd = localStorage.getItem(draftKey);
        if (savedMd && savedMd.trim()) {
          editor.commands.setContent(`<p>${savedMd.replace(/\n/g, '<br>')}</p>`);
          setDraftRestored(true);
          return;
        }
      } catch {}
    }

    if (value && value.trim()) {
      editor.commands.setContent(`<p>${value.replace(/\n/g, '<br>')}</p>`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [value, draftKey]);

  const codePickerRef = useRef<HTMLDivElement>(null);
  const videoPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const onCodeBtn  = codeBtnRef.current?.contains(target);
      const onVideoBtn = videoBtnRef.current?.contains(target);
      if (!onCodeBtn && codePickerRef.current && !codePickerRef.current.contains(target)) {
        setShowCodePicker(false);
      }
      if (!onVideoBtn && videoPickerRef.current && !videoPickerRef.current.contains(target)) {
        setShowVideoPicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleInsertCode = (lang: string) => {
    setShowCodePicker(false);
    editor?.chain().focus().setCodeBlock({ language: lang }).run();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          editor?.chain().focus().insertContent({
            type: 'image',
            attrs: { src: data.url, alt: file.name },
          }).run();
        }
      }
    } catch {}
    finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleInsertVideo = () => {
    const url = videoUrl.trim();
    if (!url) return;
    setShowVideoPicker(false);
    setVideoUrl('');

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      editor?.chain().focus().setYoutubeVideo({ src: url }).run();
    } else {
      editor?.chain().focus().insertContent(`::video[${url}]`).run();
    }
  };

  const isActive = (name: string, attrs?: Record<string, any>) =>
    editor?.isActive(name, attrs) ?? false;

  const getAlign = (): string => {
    if (!editor) return 'left';
    const attrs = editor.getAttributes('paragraph');
    return attrs.textAlign ?? editor.getAttributes('heading').textAlign ?? 'left';
  };

  return (
    <div className="rich-editor-root">
      {/* ── Тулбар ── */}
      <div className="rich-editor-toolbar">
        {/* Переключатель режимов */}
        <div className="rich-editor-mode-toggle">
          <button
            type="button"
            className={`rich-editor-mode-btn${mode === 'edit' ? ' rich-editor-mode-btn--active' : ''}`}
            onClick={() => { setMode('edit'); editor?.commands.focus(); }}>
            <i className="fa-solid fa-pencil" style={{ fontSize: 11, marginRight: 5 }} />{t('editor.editor', 'Редактор')}
          </button>
          <button
            type="button"
            className={`rich-editor-mode-btn${mode === 'preview' ? ' rich-editor-mode-btn--active' : ''}`}
            onClick={() => setMode('preview')}>
            <i className="fa-regular fa-eye" style={{ fontSize: 11, marginRight: 5 }} />{t('editor.preview', 'Результат')}
          </button>
        </div>

        {mode === 'edit' && (
          <>
            <div className="rich-editor-toolbar-sep" />

            {/* Заголовки */}
            <div className="rich-editor-toolbar-group">
              {([1, 2, 3] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  title={t(`editor.h${n}` as any, `Заголовок H${n}`)}
                  className={`rich-editor-toolbar-btn${isActive('heading', { level: n }) ? ' rich-editor-toolbar-btn--active' : ''}`}
                  onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: n }).run(); }}>
                  H{n}
                </button>
              ))}
            </div>

            <div className="rich-editor-toolbar-sep" />

            {/* Форматирование */}
            <div className="rich-editor-toolbar-group">
              <button
                type="button"
                title={t('editor.bold', 'Жирный (Ctrl+B)')}
                className={`rich-editor-toolbar-btn${isActive('bold') ? ' rich-editor-toolbar-btn--active' : ''}`}
                style={{ fontWeight: 800 }}
                onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBold().run(); }}>B</button>
              <button
                type="button"
                title={t('editor.italic', 'Курсив (Ctrl+I)')}
                className={`rich-editor-toolbar-btn${isActive('italic') ? ' rich-editor-toolbar-btn--active' : ''}`}
                style={{ fontStyle: 'italic' }}
                onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleItalic().run(); }}>I</button>
              <button
                type="button"
                title={t('editor.strike', 'Зачёркнутый')}
                className={`rich-editor-toolbar-btn${isActive('strike') ? ' rich-editor-toolbar-btn--active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleStrike().run(); }}>
                <span style={{ textDecoration: 'line-through' }}>S</span>
              </button>
              <button
                type="button"
                title={t('editor.code', 'Код')}
                className={`rich-editor-toolbar-btn${isActive('code') ? ' rich-editor-toolbar-btn--active' : ''}`}
                style={{ fontFamily: 'monospace', fontSize: 11 }}
                onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleCode().run(); }}>
                {'</>'}
              </button>
            </div>

            <div className="rich-editor-toolbar-sep" />

            {/* Структура */}
            <div className="rich-editor-toolbar-group">
              <button
                type="button"
                title={t('editor.hint', 'Цитата')}
                className={`rich-editor-toolbar-btn${isActive('blockquote') ? ' rich-editor-toolbar-btn--active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBlockquote().run(); }}>
                <i className="fa-solid fa-quote-left" style={{ fontSize: 11 }} />
              </button>
              <button
                type="button"
                title={t('editor.bulletList', 'Маркированный список')}
                className={`rich-editor-toolbar-btn${isActive('bulletList') ? ' rich-editor-toolbar-btn--active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBulletList().run(); }}>
                <i className="fa-solid fa-list-ul" style={{ fontSize: 11 }} />
              </button>
              <button
                type="button"
                title={t('editor.orderedList', 'Нумерованный список')}
                className={`rich-editor-toolbar-btn${isActive('orderedList') ? ' rich-editor-toolbar-btn--active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleOrderedList().run(); }}>
                <i className="fa-solid fa-list-ol" style={{ fontSize: 11 }} />
              </button>
              <button
                type="button"
                title={t('editor.divider', 'Разделитель')}
                className="rich-editor-toolbar-btn"
                onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().setHorizontalRule().run(); }}>
                <i className="fa-solid fa-minus" style={{ fontSize: 11 }} />
              </button>
            </div>

            <div className="rich-editor-toolbar-sep" />

            {/* Выравнивание */}
            <div className="rich-editor-toolbar-group">
              <button
                type="button"
                title={t('editor.alignLeft', 'По левому краю')}
                className={`rich-editor-toolbar-btn${getAlign() === 'left' ? ' rich-editor-toolbar-btn--active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().setTextAlign('left').run(); }}>
                <i className="fa-solid fa-align-left" style={{ fontSize: 11 }} />
              </button>
              <button
                type="button"
                title={t('editor.alignCenter', 'По центру')}
                className={`rich-editor-toolbar-btn${getAlign() === 'center' ? ' rich-editor-toolbar-btn--active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().setTextAlign('center').run(); }}>
                <i className="fa-solid fa-align-center" style={{ fontSize: 11 }} />
              </button>
              <button
                type="button"
                title={t('editor.alignRight', 'По правому краю')}
                className={`rich-editor-toolbar-btn${getAlign() === 'right' ? ' rich-editor-toolbar-btn--active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().setTextAlign('right').run(); }}>
                <i className="fa-solid fa-align-right" style={{ fontSize: 11 }} />
              </button>
            </div>

            <div className="rich-editor-toolbar-sep" />

            {/* Медиа */}
            <div className="rich-editor-toolbar-group" style={{ position: 'relative' }}>
              <button
                ref={codeBtnRef}
                type="button"
                title={t('editor.code', 'Блок кода')}
                className={`rich-editor-toolbar-btn rich-editor-toolbar-btn--accent${showCodePicker ? ' rich-editor-toolbar-btn--active' : ''}`}
                onClick={() => {
                  if (showCodePicker) { setShowCodePicker(false); return; }
                  const rect = codeBtnRef.current?.getBoundingClientRect();
                  if (rect) setPickerPos({ top: rect.bottom + 6, left: rect.left });
                  setShowCodePicker(true);
                  setShowVideoPicker(false);
                }}>
                <i className="fa-solid fa-code" style={{ fontSize: 11, marginRight: 4 }} />{t('editor.code', 'Код')}
              </button>

              <label
                title={t('editor.uploadMedia', 'Загрузить изображение или видео')}
                className={`rich-editor-toolbar-btn rich-editor-toolbar-btn--accent${uploading ? ' rich-editor-toolbar-btn--disabled' : ''}`}
                style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
                {uploading
                  ? <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 11 }} />
                  : <i className="fa-regular fa-image" style={{ fontSize: 11, marginRight: 4 }} />}
                {uploading ? t('common.loading', 'Загрузка...') : t('editor.media', 'Медиа')}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/mp4,video/webm"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>

              <button
                ref={videoBtnRef}
                type="button"
                title={t('editor.videoPickerTitle', 'YouTube или Vimeo')}
                className={`rich-editor-toolbar-btn rich-editor-toolbar-btn--accent${showVideoPicker ? ' rich-editor-toolbar-btn--active' : ''}`}
                onClick={() => {
                  if (showVideoPicker) { setShowVideoPicker(false); return; }
                  const rect = videoBtnRef.current?.getBoundingClientRect();
                  if (rect) setVideoPickerPos({ top: rect.bottom + 6, left: rect.left });
                  setShowVideoPicker(true);
                  setShowCodePicker(false);
                }}>
                <i className="fa-brands fa-youtube" style={{ fontSize: 11, marginRight: 4 }} />{t('editor.youtube', 'YouTube')}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Портальные пикеры ── */}
      {showCodePicker && pickerPos && typeof document !== 'undefined' && createPortal(
        <div
          ref={codePickerRef}
          className="rich-editor-picker rich-editor-code-picker"
          style={{ position: 'fixed', top: pickerPos.top, left: pickerPos.left, zIndex: 9999 }}>
          <div className="rich-editor-picker-title">
            <i className="fa-solid fa-code" style={{ marginRight: 6 }} />{t('editor.progLanguage', 'Язык программирования')}
          </div>
          <div className="rich-editor-code-grid">
            {CODE_LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                type="button"
                className="rich-editor-code-item"
                onMouseDown={(e) => { e.preventDefault(); handleInsertCode(lang.value); }}>
                {lang.label}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}

      {showVideoPicker && videoPickerPos && typeof document !== 'undefined' && createPortal(
        <div
          ref={videoPickerRef}
          className="rich-editor-picker rich-editor-video-picker"
          style={{ position: 'fixed', top: videoPickerPos.top, left: videoPickerPos.left, zIndex: 9999 }}>
          <div className="rich-editor-picker-title">
            <i className="fa-brands fa-youtube" style={{ marginRight: 6 }} />{t('editor.videoPickerTitle', 'YouTube или Vimeo')}
          </div>
          <input
            ref={videoUrlInputRef}
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="rich-editor-video-input"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleInsertVideo(); }}}
          />
          <button
            type="button"
            onClick={handleInsertVideo}
            disabled={!videoUrl.trim()}
            className="rich-editor-video-insert-btn">
            <i className="fa-solid fa-plus" style={{ marginRight: 6 }} />{t('editor.insertVideo', 'Вставить видео')}
          </button>
        </div>,
        document.body
      )}

      {/* ── Баннер восстановленного черновика ── */}
      {draftRestored && (
        <div className="rich-editor-draft-banner">
          <i className="fa-solid fa-rotate-left" style={{ marginRight: 8 }} />
          <span>{t('editor.draftRestored', 'Черновик восстановлен')}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="rich-editor-draft-btn rich-editor-draft-btn--dismiss"
              onClick={() => setDraftRestored(false)}>
              {t('common.yes', 'Ок')}
            </button>
            <button
              type="button"
              className="rich-editor-draft-btn rich-editor-draft-btn--discard"
              onClick={() => {
                if (draftKey) {
                  localStorage.removeItem(draftKey);
                  localStorage.removeItem(draftKey + '_json');
                }
                editor?.commands.clearContent();
                onChange('');
                setDraftRestored(false);
              }}>
              {t('editor.discardDraft', 'Удалить черновик')}
            </button>
          </div>
        </div>
      )}

      {/* ── Редактор (Tiptap WYSIWYG) ── */}
      {mode === 'edit' && (
        <div className="rich-editor-body" ref={editorWrapRef} style={{ position: 'relative' }}>
          {bubblePos && editor && !editor.state.selection.empty && (
            <div
              className="rich-bubble-menu"
              style={{ position: 'absolute', left: bubblePos.x, top: bubblePos.y, zIndex: 50 }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <button
                type="button"
                className={`rich-bubble-btn${isActive('bold') ? ' rich-bubble-btn--active' : ''}`}
                onClick={() => editor.chain().focus().toggleBold().run()}
                style={{ fontWeight: 800 }}>B</button>
              <button
                type="button"
                className={`rich-bubble-btn${isActive('italic') ? ' rich-bubble-btn--active' : ''}`}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                style={{ fontStyle: 'italic' }}>I</button>
              <button
                type="button"
                className={`rich-bubble-btn${isActive('strike') ? ' rich-bubble-btn--active' : ''}`}
                onClick={() => editor.chain().focus().toggleStrike().run()}>
                <span style={{ textDecoration: 'line-through' }}>S</span>
              </button>
              <button
                type="button"
                className={`rich-bubble-btn${isActive('code') ? ' rich-bubble-btn--active' : ''}`}
                onClick={() => editor.chain().focus().toggleCode().run()}
                style={{ fontFamily: 'monospace', fontSize: 11 }}>{'</>'}</button>
            </div>
          )}
          <EditorContent editor={editor} className="rich-editor-tiptap-wrap" />
        </div>
      )}

      {/* ── Превью ── */}
      {mode === 'preview' && (
        <div className="rich-editor-preview-body">
          {value.trim() ? (
            <MarkdownBody content={value} />
          ) : (
            <p className="rich-editor-preview-empty">
              <i className="fa-regular fa-file-lines" style={{ marginRight: 8, opacity: 0.4 }} />
              {t('editor.emptyPreview', 'Начните писать статью — результат появится здесь')}
            </p>
          )}
        </div>
      )}

      {/* ── Подсказка + статус автосохранения ── */}
      {mode === 'edit' && (
        <div className="rich-editor-hint">
          <span style={{ flex: 1 }}>
            <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: 6 }} />
            {t('editor.hint', 'WYSIWYG · Ctrl+B жирный · Ctrl+I курсив · выделите текст для быстрого меню')}
          </span>
          {draftKey && saveStatus !== 'idle' && (
            <span className={`rich-editor-autosave rich-editor-autosave--${saveStatus}`}>
              {saveStatus === 'saving'
                ? <><i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: 5 }} />{t('common.saving', 'Сохранение…')}</>
                : <><i className="fa-solid fa-cloud-arrow-up" style={{ marginRight: 5 }} />{t('common.saved', 'Черновик сохранён')}</>}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
