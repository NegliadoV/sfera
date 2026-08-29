'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/components/i18n/LanguageProvider';

export interface CommentItem {
  id: string;
  contentId: string;
  authorId: string;
  authorName: string | null;
  authorImage?: string | null;
  parentId?: string | null;
  type?: string;
  body: string;
  createdAt: string | Date;
}

interface InlineCommentsSectionProps {
  contentId: string;
  initialCount?: number;
  currentUserId?: string | null;
  currentUserImage?: string | null;
  currentUserName?: string | null;
}

export function InlineCommentsSection({
  contentId,
  currentUserId,
  currentUserImage,
  currentUserName,
}: InlineCommentsSectionProps) {
  const { t, locale } = useTranslation();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const scrollBoxRef = useRef<HTMLDivElement>(null);

  // Загрузка комментариев при монтировании
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/content/${contentId}/comments`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          setComments(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [contentId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting || !currentUserId) return;

    setSubmitting(true);
    setModerationError(null);

    try {
      const res = await fetch(`/api/content/${contentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text.trim() }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        setModerationError(data?.botMessage || data?.error || 'Не удалось отправить комментарий');
        return;
      }

      // Добавляем созданный комментарий в список
      const newComment: CommentItem = {
        id: data.id || crypto.randomUUID(),
        contentId,
        authorId: currentUserId,
        authorName: currentUserName || 'Вы',
        authorImage: currentUserImage,
        body: text.trim(),
        createdAt: new Date().toISOString(),
      };

      setComments((prev) => [...prev, newComment]);
      setText('');
      setExpanded(true);

      // Скроллим блок комментариев вниз к новому комментарию
      setTimeout(() => {
        if (scrollBoxRef.current) {
          scrollBoxRef.current.scrollTop = scrollBoxRef.current.scrollHeight;
        }
      }, 50);
    } catch (err) {
      console.error(err);
      setModerationError('Ошибка соединения');
    } finally {
      setSubmitting(false);
    }
  };

  // Первые 2 комментария или все (если развернуто)
  const visibleComments = expanded ? comments : comments.slice(-2);
  const hasMore = comments.length > 2;

  const formatDate = (dateVal: string | Date) => {
    try {
      const d = new Date(dateVal);
      return d.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 pt-4 border-t border-white/10 mt-2">
      {/* Кнопка "Посмотреть все комментарии" */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-white/50 hover:text-white font-medium text-left transition flex items-center gap-1.5 cursor-pointer self-start"
        >
          <i className={`fa-solid ${expanded ? 'fa-chevron-up' : 'fa-comments'}`} />
          {expanded
            ? t('content.hideComments', 'Скрыть комментарии')
            : `${t('content.viewAllComments', 'Посмотреть все комментарии')} (${comments.length})`}
        </button>
      )}

      {/* Список комментариев с отдельным изолированным скроллом */}
      {comments.length > 0 ? (
        <div
          ref={scrollBoxRef}
          className={`flex flex-col gap-2.5 ${
            expanded ? 'max-h-[300px] overflow-y-auto overscroll-contain pr-2' : ''
          }`}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.2) transparent',
          }}
        >
          {visibleComments.map((c) => {
            const authorInitial = (c.authorName || '?').charAt(0).toUpperCase();
            return (
              <div key={c.id} className="flex items-start gap-2.5 text-xs group">
                {/* Аватарка */}
                <div className="w-7 h-7 rounded-full bg-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-white/80 text-[10px] border border-white/10 mt-0.5">
                  {c.authorImage ? (
                    <img src={c.authorImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{authorInitial}</span>
                  )}
                </div>

                {/* Текст и автор */}
                <div className="flex-1 bg-white/[0.04] p-2.5 rounded-xl border border-white/5 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white/90">{c.authorName || 'Участник'}</span>
                    <span className="text-[10px] text-white/40">{formatDate(c.createdAt)}</span>
                  </div>
                  <p className="text-white/85 text-xs leading-relaxed m-0 whitespace-pre-wrap break-words">
                    {c.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : loading ? (
        <p className="text-xs text-white/40 italic m-0">Загрузка комментариев...</p>
      ) : (
        <p className="text-xs text-white/40 italic m-0">
          {t('content.noCommentsYet', 'Пока нет комментариев. Напишите первым!')}
        </p>
      )}

      {/* Предупреждение автомодератора */}
      {moderationError && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2 animate-in fade-in">
          <i className="fa-solid fa-robot mt-0.5 text-amber-400" />
          <div className="flex-1 leading-snug">{moderationError}</div>
        </div>
      )}

      {/* Форма быстрого добавления комментария */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2">
          <div className="w-7 h-7 rounded-full bg-[var(--accent-primary)]/20 flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-[var(--accent-primary)] text-[10px] border border-[var(--accent-primary)]/30">
            {currentUserImage ? (
              <img src={currentUserImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{(currentUserName || 'Я').charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div className="relative flex-1">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('content.commentPlaceholder', 'Написать комментарий...')}
              disabled={submitting}
              className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-white text-xs placeholder-white/40 focus:outline-none focus:border-[var(--accent-primary)] focus:bg-white/[0.09] transition-all"
            />
            {text.trim() && (
              <button
                type="submit"
                disabled={submitting}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-[var(--accent-primary)] text-white flex items-center justify-center hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
                title={t('content.addComment', 'Отправить')}
              >
                {submitting ? (
                  <i className="fa-solid fa-spinner fa-spin text-[10px]" />
                ) : (
                  <i className="fa-solid fa-paper-plane text-[10px]" />
                )}
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="pt-2 text-xs text-white/50">
          <Link href="/auth/signin" className="text-[var(--accent-primary)] hover:underline">
            {t('content.loginToComment', 'Войдите, чтобы оставить комментарий')}
          </Link>
        </div>
      )}
    </div>
  );
}
