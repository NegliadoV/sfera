'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ReactionButtons } from '@/components/ReactionButtons';
import { CommentReactions } from '@/components/CommentReactions';
import { COMMENT_LABELS, type CommentType } from '@/lib/reactions';
import { useContentPresence } from '@/components/useContentPresence';

type Comment = {
  id: string;
  contentId: string;
  authorId: string;
  authorName: string | null;
  parentId: string | null;
  type: string;
  body: string;
  createdAt: string | Date;
};

type Props = {
  contentId: string;
  initialComments: Comment[];
  initialReactions: { counts: Record<string, number>; myReaction: string | null };
  isAuthenticated: boolean;
  currentUser?: { userId: string; userName: string | null } | null;
};

function buildTree(comments: Comment[]): Map<string | null, Comment[]> {
  const byParent = new Map<string | null, Comment[]>();
  for (const c of comments) {
    const key = c.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(c);
  }
  for (const arr of byParent.values()) {
    arr.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }
  return byParent;
}

function CommentTree({
  parentId,
  byParent,
  contentId,
  isAuthenticated,
  onReply,
  refreshReactions,
  currentUserId,
}: {
  parentId: string | null;
  byParent: Map<string | null, Comment[]>;
  contentId: string;
  isAuthenticated: boolean;
  onReply: (parentId: string | null, type: CommentType, body: string) => void;
  refreshReactions: () => void;
  currentUserId?: string | null;
}) {
  const children = byParent.get(parentId) ?? [];
  return (
    <ul className={parentId ? 'pl-6 mt-2 border-l-2 border-[var(--border-color)]' : 'list-none p-0 m-0'}>
      {children.map((c) => (
        <li key={c.id} className="mb-4">
          <div
            className="rounded-[var(--radius-md)] p-3"
            style={{ backgroundColor: 'var(--bg-accent)' }}
          >
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {c.authorName ?? 'Участник'}
              </span>
              {isAuthenticated && currentUserId && c.authorId && c.authorId !== currentUserId && (
                <Link
                  href={`/messages/${encodeURIComponent(c.authorId)}`}
                  className="text-xs"
                  style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}
                >
                  Написать
                </Link>
              )}
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}
              >
                {COMMENT_LABELS[c.type as CommentType] ?? c.type}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {new Date(c.createdAt as string | Date).toLocaleString('ru')}
              </span>
            </div>
            <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
              {c.body}
            </p>
            <CommentReactions commentId={c.id} onUpdate={refreshReactions} />
          </div>
          <CommentTree
            parentId={c.id}
            byParent={byParent}
            contentId={contentId}
            isAuthenticated={isAuthenticated}
            onReply={onReply}
            refreshReactions={refreshReactions}
            currentUserId={currentUserId}
          />
        </li>
      ))}
    </ul>
  );
}

const TYPING_THROTTLE_MS = 1500;

export function DiscussionBlock({
  contentId,
  initialComments,
  initialReactions,
  isAuthenticated,
  currentUser = null,
}: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [reactions, setReactions] = useState(initialReactions);
  const [type, setType] = useState<CommentType>('thesis');
  const [body, setBody] = useState('');
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const lastTypingSent = useRef<number>(0);

  const { typingUsers, presenceUsers, emitTypingStart, emitTypingStop } = useContentPresence(contentId, currentUser);

  const handleTyping = useCallback(() => {
    if (!currentUser) return;
    const now = Date.now();
    if (now - lastTypingSent.current >= TYPING_THROTTLE_MS) {
      lastTypingSent.current = now;
      emitTypingStart();
    }
  }, [currentUser, emitTypingStart]);

  const handleBlur = useCallback(() => {
    emitTypingStop();
  }, [emitTypingStop]);

  const refreshComments = useCallback(async () => {
    const res = await fetch(`/api/content/${contentId}/comments`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      setComments(data);
    }
  }, [contentId]);

  const refreshReactions = useCallback(async () => {
    const res = await fetch(`/api/reactions?targetType=content&targetId=${contentId}`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      setReactions({ counts: data.counts ?? {}, myReaction: data.myReaction ?? null });
    }
  }, [contentId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || !isAuthenticated) return;
    setPending(true);
    setSubmitError('');
    try {
      const res = await fetch(`/api/content/${contentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type, body: body.trim() }),
      });
      if (res.ok) {
        setBody('');
        emitTypingStop();
        await refreshComments();
      } else {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data?.error ?? 'Не удалось отправить комментарий');
      }
    } catch {
      setSubmitError('Ошибка соединения. Попробуйте ещё раз.');
    } finally {
      setPending(false);
    }
  };

  const byParent = buildTree(comments);

  return (
    <section className="mt-4" style={{ color: 'var(--text-primary)' }}>
      <h3 className="text-lg font-semibold mb-4">Обсуждение</h3>
      {presenceUsers.length > 0 && (
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          Сейчас здесь: {presenceUsers.map((u) => u.userName ?? 'Участник').join(', ')}
        </p>
      )}
      <div className="mb-4">
        <ReactionButtons
          targetType="content"
          targetId={contentId}
          counts={reactions.counts}
          myReaction={reactions.myReaction}
          onUpdate={refreshReactions}
        />
      </div>
      <CommentTree
        parentId={null}
        byParent={byParent}
        contentId={contentId}
        isAuthenticated={isAuthenticated}
        onReply={async () => {}}
        refreshReactions={refreshReactions}
        currentUserId={currentUser?.userId}
      />
      {isAuthenticated ? (
        <form onSubmit={onSubmit} className="mt-6">
          <div className="flex flex-wrap gap-4 mb-2" role="radiogroup" aria-label="Тип комментария">
            {(Object.keys(COMMENT_LABELS) as CommentType[]).map((t) => (
              <label
                key={t}
                className="inline-flex items-center gap-2 cursor-pointer px-3 py-2 rounded-[var(--radius-md)] border transition-colors hover:bg-[var(--hover-color)]"
                style={{
                  borderColor: type === t ? 'var(--accent-primary)' : 'var(--border-color)',
                  backgroundColor: type === t ? 'color-mix(in srgb, var(--accent-primary) 15%, transparent)' : 'transparent',
                }}
              >
                <input
                  type="radio"
                  name="type"
                  value={t}
                  checked={type === t}
                  onChange={() => setType(t)}
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{COMMENT_LABELS[t]}</span>
              </label>
            ))}
          </div>
          {submitError && (
            <p className="text-sm mb-2" style={{ color: 'var(--accent-red)' }}>
              {submitError}
            </p>
          )}
          <textarea
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              handleTyping();
            }}
            onFocus={emitTypingStart}
            onBlur={handleBlur}
            placeholder="Ваш комментарий..."
            rows={3}
            className="w-full rounded-[var(--radius-md)] p-3 border resize-y mb-2"
            style={{
              backgroundColor: 'var(--bg-accent)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
          {typingUsers.length > 0 && (
            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              {typingUsers.length === 1
                ? `${typingUsers[0].userName ?? 'Участник'} печатает…`
                : `${typingUsers.length} человек печатают…`}
            </p>
          )}
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className="px-4 py-2 rounded-[var(--radius-md)] font-medium disabled:opacity-50"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              cursor: pending ? 'wait' : 'pointer',
            }}
          >
            {pending ? 'Отправка...' : 'Отправить'}
          </button>
        </form>
      ) : (
        <p className="text-sm mt-4" style={{ color: 'var(--text-secondary)' }}>
          Войдите, чтобы участвовать в обсуждении и оставлять реакции.
        </p>
      )}
    </section>
  );
}
