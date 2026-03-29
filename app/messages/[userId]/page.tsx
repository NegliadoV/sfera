'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useDMSocket } from '@/hooks/useDMSocket';
import type { DmNewMessagePayload } from '@/hooks/useDMSocket';
import { YouTubeEmbed } from '@/components/YouTubeEmbed';
import { EmojiPicker } from '@/components/EmojiPicker';
import { GifPicker } from '@/components/GifPicker';
import { ImageLightbox } from '@/components/ImageLightbox';
import { SharedContentLinkPreview, getContentId } from '@/components/SharedContentLinkPreview';
import { getYouTubeVideoId } from '@/lib/youtube';

type MessageItem = {
  id: string;
  senderId: string;
  senderName: string | null;
  body: string;
  attachmentUrl: string | null;
  attachmentType: string | null;
  createdAt: string;
  readAt: string | null;
};

const URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+|\/universes\/[^\s<>"{}|\\^`[\]]+)/gi;

/** Рендер текста с кликабельными ссылками; ссылки на контент — превью карточка; YouTube — встроенный плеер */
function MessageBodyWithPreviews({ body }: { body: string }) {
  const parts = body.split(URL_REGEX);
  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        const isUrl = part.match(URL_REGEX);
        if (!isUrl) return <span key={i}>{part}</span>;
        const contentId = getContentId(part);
        if (contentId) {
          return <SharedContentLinkPreview key={i} url={part} contentId={contentId} />;
        }
        const ytId = getYouTubeVideoId(part);
        if (ytId) {
          return (
            <div key={i} style={{ margin: '10px 0', minWidth: 320, maxWidth: 560, width: '100%' }}>
              <a href={part} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', fontSize: '0.85rem', display: 'block', marginBottom: 8, wordBreak: 'break-all' }}>
                {part}
              </a>
              <YouTubeEmbed videoId={ytId} title="YouTube" compact={false} />
            </div>
          );
        }
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', wordBreak: 'break-all' }}>
            {part}
          </a>
        );
      })}
    </>
  );
}

const TYPING_DURATION_MS = 3000;

export default function MessageChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shareContent = searchParams.get('shareContent');
  const shareTitle = searchParams.get('shareTitle');
  const shareSlug = searchParams.get('shareSlug');
  const sharePrefilledRef = useRef(false);

  const { data: session } = useSession();
  const userId = params?.userId as string;
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [otherUser, setOtherUser] = useState<{ name: string | null; image: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [attachment, setAttachment] = useState<{ url: string; type: 'image' | 'video' | 'audio' | 'file'; filename?: string } | null>(null);
  const [recording, setRecording] = useState(false);
  const [videoRecording, setVideoRecording] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const typingStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const appendMessage = useCallback((m: MessageItem) => {
    setMessages((prev) => {
      if (prev.some((x) => x.id === m.id)) return prev;
      return [...prev, m];
    });
  }, []);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; message: MessageItem; isMe: boolean } | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; body: string; senderName: string | null } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const menuBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%' as const,
    padding: '8px 12px',
    textAlign: 'left' as const,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    borderRadius: 4,
  };

  const handleReply = useCallback((message: MessageItem) => {
    setContextMenu(null);
    setReplyingTo({ id: message.id, body: message.body, senderName: message.senderName });
    setTimeout(() => document.querySelector<HTMLInputElement>('input[placeholder="Сообщение…"]')?.focus(), 50);
  }, []);

  const handleCopyText = useCallback(async (message: MessageItem) => {
    setContextMenu(null);
    const text = message.body || (message.attachmentUrl ? '📎' : '');
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  }, []);

  const handleCopyLink = useCallback((message: MessageItem) => {
    setContextMenu(null);
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/messages/${userId}#msg-${message.id}`;
    navigator.clipboard.writeText(url).catch(() => {});
  }, [userId]);

  const handleForward = useCallback((message: MessageItem) => {
    setContextMenu(null);
    const text = message.body || (message.attachmentUrl ? '📎' : '');
    navigator.clipboard.writeText(text).catch(() => {});
    setToast('Скопировано. Вставьте в другой чат.');
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleReport = useCallback((_message: MessageItem) => {
    setContextMenu(null);
    setToast('Жалоба отправлена.');
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleSelect = useCallback((messageId: string) => {
    setContextMenu(null);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  }, []);

  const handleDeleteForMe = useCallback(
    async (messageId: string) => {
      if (!userId || actioningId) return;
      setContextMenu(null);
      setActioningId(messageId);
      try {
        const res = await fetch(
          `/api/me/conversations/${encodeURIComponent(userId)}/messages/${encodeURIComponent(messageId)}/hide`,
          { method: 'POST', credentials: 'include' }
        );
        if (res.ok) {
          setMessages((prev) => prev.filter((m) => m.id !== messageId));
          window.dispatchEvent(new CustomEvent('messages-badge-refresh'));
        }
      } finally {
        setActioningId(null);
      }
    },
    [userId, actioningId]
  );

  const handleDeleteForAll = useCallback(
    async (messageId: string) => {
      if (!userId || actioningId) return;
      setContextMenu(null);
      setActioningId(messageId);
      try {
        const res = await fetch(
          `/api/me/conversations/${encodeURIComponent(userId)}/messages/${encodeURIComponent(messageId)}`,
          { method: 'DELETE', credentials: 'include' }
        );
        if (res.ok) {
          setMessages((prev) => prev.filter((m) => m.id !== messageId));
          window.dispatchEvent(new CustomEvent('messages-badge-refresh'));
        }
      } finally {
        setActioningId(null);
      }
    },
    [userId, actioningId]
  );

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('contextmenu', close);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('contextmenu', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [contextMenu]);

  const { emitTyping, emitTypingStop } = useDMSocket(
    (msg: DmNewMessagePayload) => {
      if (msg.senderId === userId) {
        appendMessage({
          id: msg.id,
          senderId: msg.senderId,
          senderName: msg.senderName,
          body: msg.body,
          attachmentUrl: msg.attachmentUrl ?? null,
          attachmentType: msg.attachmentType ?? null,
          createdAt: msg.createdAt,
          readAt: null,
        });
        window.dispatchEvent(new CustomEvent('messages-badge-refresh'));
      }
    },
    !!userId,
    {
      peerUserId: userId,
      myUserName: session?.user?.name ?? null,
      onTyping: useCallback((typingUserId: string) => {
        if (typingUserId === userId) setOtherTyping(true);
        if (typingStopRef.current) clearTimeout(typingStopRef.current);
        typingStopRef.current = setTimeout(() => setOtherTyping(false), TYPING_DURATION_MS);
      }, [userId]),
      onTypingStop: useCallback((typingUserId: string) => {
        if (typingUserId === userId) setOtherTyping(false);
      }, [userId]),
      onReadReceipt: useCallback((readerId: string) => {
        if (readerId === userId && session?.user?.id) {
          const me = session.user.id;
          setMessages((prev) =>
            prev.map((m) => (m.senderId === me ? { ...m, readAt: new Date().toISOString() } : m))
          );
        }
      }, [userId, session?.user?.id]),
    }
  );

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (!userId) return;
    return () => {
      fetch(`/api/me/conversations/${encodeURIComponent(userId)}/read`, { method: 'PATCH', credentials: 'include' })
        .then((r) => { if (r.ok) window.dispatchEvent(new CustomEvent('messages-badge-refresh')); })
        .catch(() => {});
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/me/conversations/${encodeURIComponent(userId)}`, { credentials: 'include' })
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          if (res.status === 403) router.push('/messages');
          return;
        }
        return res.json();
      })
      .then((data: { messages?: Array<Partial<MessageItem>>; otherUser?: { name: string | null; image: string | null } }) => {
        if (!data || cancelled) return;
        setMessages((data.messages ?? []).map((m) => ({
          id: m.id!,
          senderId: m.senderId!,
          senderName: m.senderName ?? null,
          body: m.body ?? '',
          attachmentUrl: m.attachmentUrl ?? null,
          attachmentType: m.attachmentType ?? null,
          createdAt: m.createdAt!,
          readAt: m.readAt ?? null,
        })));
        setOtherUser(data.otherUser ?? { name: null, image: null });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId, router]);

  useEffect(() => {
    if (!shareContent || !shareSlug || sharePrefilledRef.current || typeof window === 'undefined') return;
    sharePrefilledRef.current = true;
    const contentUrl = `${window.location.origin}/universes/${encodeURIComponent(shareSlug)}/content/${encodeURIComponent(shareContent)}`;
    setInputValue(contentUrl);
  }, [shareContent, shareSlug]);

  async function handleBlock() {
    if (!userId) return;
    const res = await fetch('/api/me/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ blockedUserId: userId }),
    });
    if (res.ok) router.push('/messages');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = inputValue.trim();
    if ((!body && !attachment) || sending || !userId) return;
    setSending(true);
    const currentAttachment = attachment;
    setInputValue('');
    setAttachment(null);
    setReplyingTo(null);
    try {
      const res = await fetch(`/api/me/conversations/${encodeURIComponent(userId)}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          body: body || (currentAttachment ? '📎' : ''),
          attachmentUrl: currentAttachment?.url ?? undefined,
          attachmentType: currentAttachment?.type ?? undefined,
          attachmentName: (currentAttachment?.type === 'file' || currentAttachment?.type === 'audio') ? currentAttachment?.filename : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        appendMessage({
          id: data.id,
          senderId: data.senderId,
          senderName: null,
          body: data.body,
          attachmentUrl: data.attachmentUrl ?? null,
          attachmentType: data.attachmentType ?? null,
          createdAt: data.createdAt,
          readAt: data.readAt ?? null,
        });
        if (shareContent && shareSlug) {
          router.replace(`/messages/${encodeURIComponent(userId)}`, { scroll: false });
        }
        fetch(`/api/me/conversations/${encodeURIComponent(userId)}/read`, { method: 'PATCH', credentials: 'include' })
          .then((r) => { if (r.ok) window.dispatchEvent(new CustomEvent('messages-badge-refresh')); })
          .catch(() => {});
      }
    } finally {
      setSending(false);
    }
  }

  async function handleVoiceRecord() {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
      const mime = mimeTypes.find((t) => MediaRecorder.isTypeSupported(t)) ?? 'audio/webm';
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const chunks = [...chunksRef.current];
        if (chunks.length === 0) return;
        const blob = new Blob(chunks, { type: mime });
        if (blob.size < 100) return;
        const file = new File([blob], 'voice.webm', { type: mime.startsWith('audio/') ? mime : 'audio/webm' });
        const fd = new FormData();
        fd.append('file', file);
        try {
          const res = await fetch('/api/me/chat-upload', { method: 'POST', credentials: 'include', body: fd });
          const data = await res.json();
          if (res.ok && data.url && data.type === 'audio') {
            setAttachment({ url: data.url, type: 'audio', filename: 'Голосовое сообщение' });
          }
        } catch {
          // ignore
        }
      };
      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (err) {
      console.warn('Voice recording failed:', err);
    }
  }

  async function handleVideoRecord() {
    if (videoRecording) {
      videoRecorderRef.current?.stop();
      setVideoRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
        audio: true,
      });
      videoStreamRef.current = stream;
      setVideoRecording(true);
      const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
      const mime = mimeTypes.find((t) => MediaRecorder.isTypeSupported(t)) ?? 'video/webm';
      const recorder = new MediaRecorder(stream);
      videoChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) videoChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        videoStreamRef.current = null;
        if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
        const chunks = [...videoChunksRef.current];
        if (chunks.length === 0) return;
        const blob = new Blob(chunks, { type: mime });
        if (blob.size < 1000) return;
        const ext = mime.includes('webm') ? 'webm' : 'mp4';
        const file = new File([blob], `video.${ext}`, { type: mime.startsWith('video/') ? mime : 'video/webm' });
        const fd = new FormData();
        fd.append('file', file);
        try {
          const res = await fetch('/api/me/chat-upload', { method: 'POST', credentials: 'include', body: fd });
          const data = await res.json();
          if (res.ok && data.url && data.type === 'video') {
            setAttachment({ url: data.url, type: 'video', filename: 'Видеокружок' });
          }
        } catch {
          // ignore
        }
      };
      recorder.start(100);
      videoRecorderRef.current = recorder;
    } catch (err) {
      console.warn('Video recording failed:', err);
    }
  }

  useEffect(() => {
    if (videoRecording && videoStreamRef.current && videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = videoStreamRef.current;
      videoPreviewRef.current.play().catch(() => {});
    }
  }, [videoRecording]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
        videoRecorderRef.current.stop();
      }
      videoStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/me/chat-upload', { method: 'POST', credentials: 'include', body: fd });
      const data = await res.json();
      if (data.url && (data.type === 'image' || data.type === 'video' || data.type === 'audio' || data.type === 'file')) {
        setAttachment({
          url: data.url,
          type: data.type,
          filename: data.filename || file.name || (data.type === 'audio' ? 'Голосовое сообщение' : undefined),
        });
      }
    } catch {
      // ignore
    }
    e.target.value = '';
  }

  async function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (!file) continue;
        const fd = new FormData();
        fd.append('file', file);
        try {
          const res = await fetch('/api/me/chat-upload', { method: 'POST', credentials: 'include', body: fd });
          const data = await res.json();
          if (res.ok && data.url) {
            setAttachment({
              url: data.url,
              type: data.type,
              filename: file.name || 'Скриншот',
            });
          }
        } catch { /* ignore */ }
        e.preventDefault();
        break;
      }
    }
  }

  if (!userId) return null;

  return (
    <div className="chat-container-glass">
      <div className="chat-header-glass">
        <Link
          href="/messages"
          style={{
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <i className="fa-solid fa-arrow-left" style={{ fontSize: '0.9rem' }} />
          Назад
        </Link>
        <div style={{ flex: 1, fontWeight: 600, fontSize: '1rem' }}>
          {loading ? '…' : otherUser?.name ?? 'Участник'}
        </div>
        <button
          type="button"
          onClick={handleBlock}
          className="text-sm"
          style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
          title="Заблокировать"
        >
          <i className="fa-solid fa-ban" style={{ marginRight: 4 }} />
          Заблокировать
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)', padding: 24 }}>Загрузка…</p>
      ) : (
        <>
            <div
            ref={listRef}
            className="chat-messages-area"
          >
            {messages.length === 0 && !otherTyping ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: 24 }}>
                Нет сообщений. Напишите первым.
              </p>
            ) : null}
            {messages.length > 0 ? (
              messages.map((m) => {
                const isFromThem = m.senderId === userId;
                const isMe = !isFromThem;
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: isFromThem ? 'flex-start' : 'flex-end',
                      maxWidth: '85%',
                      position: 'relative',
                    }}
                  >
                    <div
                      className={`chat-message-bubble ${isFromThem ? 'chat-bubble-them' : 'chat-bubble-me'} ${selectedIds.has(m.id) ? 'chat-message-selected' : ''}`}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContextMenu({ x: e.clientX, y: e.clientY, message: m, isMe });
                      }}
                    >
                    <div style={{ fontWeight: 500, fontSize: '0.8rem', marginBottom: 2, opacity: 0.9 }}>
                      {isFromThem ? (m.senderName ?? 'Участник') : 'Вы'}
                    </div>
                    {m.attachmentUrl && m.attachmentType === 'image' && (
                      <div style={{ display: 'block', marginBottom: m.body && m.body !== '📎' ? 6 : 0 }}>
                        <ImageLightbox
                          src={m.attachmentUrl}
                          alt=""
                          style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 8, objectFit: 'cover' }}
                        />
                      </div>
                    )}
                    {m.attachmentUrl && m.attachmentType === 'video' && (
                      <div style={{ marginBottom: m.body && m.body !== '📎' ? 6 : 0 }}>
                        <video src={m.attachmentUrl} controls style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 8 }} />
                      </div>
                    )}
                    {m.attachmentUrl && m.attachmentType === 'audio' && (
                      <div style={{ marginBottom: m.body && m.body !== '📎' ? 6 : 0 }}>
                        <audio src={m.attachmentUrl.split('?')[0]} controls style={{ maxWidth: '100%', height: 36 }} />
                      </div>
                    )}
                    {m.attachmentUrl && m.attachmentType === 'file' && (() => {
                      const nameMatch = m.attachmentUrl.match(/\?name=([^&]+)/);
                      const displayName = nameMatch ? decodeURIComponent(nameMatch[1]) : null;
                      const href = m.attachmentUrl.split('?')[0];
                      return (
                        <a
                          href={href}
                          download={displayName || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 12px',
                            background: 'rgba(255,255,255,0.15)',
                            borderRadius: 8,
                            marginBottom: m.body && m.body !== '📎' ? 6 : 0,
                            color: 'inherit',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                          }}
                        >
                          <i className="fa-solid fa-file-arrow-down" />
                          {displayName || `Скачать файл${href.includes('.') ? ` (.${href.split('.').pop()?.toLowerCase() || ''})` : ''}`}
                        </a>
                      );
                    })()}
                    {m.body && m.body !== '📎' ? <MessageBodyWithPreviews body={m.body} /> : null}
                    {!isFromThem && (
                      <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: 4 }}>
                        {m.readAt ? 'Прочитано' : 'Отправлено'}
                      </div>
                    )}
                    </div>
                  </div>
                );
              })
            ) : null}
            {contextMenu && typeof document !== 'undefined' && createPortal(
              <div
                role="menu"
                className="message-context-menu chat-popup-glass"
                style={{
                  position: 'fixed',
                  left: contextMenu.x,
                  top: contextMenu.y,
                  zIndex: 99999,
                  minWidth: 200,
                  padding: 4,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button type="button" role="menuitem" onClick={() => handleReply(contextMenu.message)} style={menuBtnStyle}>
                  <i className="fa-solid fa-reply" style={{ width: 16, opacity: 0.9 }} />
                  Ответить
                </button>
                <button type="button" role="menuitem" onClick={() => handleCopyText(contextMenu.message)} style={menuBtnStyle}>
                  <i className="fa-regular fa-copy" style={{ width: 16, opacity: 0.9 }} />
                  Копировать текст
                </button>
                <button type="button" role="menuitem" onClick={() => handleCopyLink(contextMenu.message)} style={menuBtnStyle}>
                  <i className="fa-solid fa-link" style={{ width: 16, opacity: 0.9 }} />
                  Копировать ссылку
                </button>
                <button type="button" role="menuitem" onClick={() => handleForward(contextMenu.message)} style={menuBtnStyle}>
                  <i className="fa-solid fa-share" style={{ width: 16, opacity: 0.9 }} />
                  Переслать
                </button>
                <button type="button" role="menuitem" onClick={() => handleReport(contextMenu.message)} style={menuBtnStyle}>
                  <i className="fa-regular fa-flag" style={{ width: 16, opacity: 0.9 }} />
                  Пожаловаться
                </button>
                <button type="button" role="menuitem" onClick={() => handleSelect(contextMenu.message.id)} style={menuBtnStyle}>
                  <i className="fa-regular fa-circle-check" style={{ width: 16, opacity: 0.9 }} />
                  Выбрать
                </button>
                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleDeleteForMe(contextMenu.message.id)}
                  disabled={actioningId === contextMenu.message.id}
                  style={{ ...menuBtnStyle, cursor: actioningId === contextMenu.message.id ? 'wait' : 'pointer' }}
                >
                  <i className="fa-regular fa-trash-can" style={{ width: 16, opacity: 0.9 }} />
                  Удалить у себя
                </button>
                {contextMenu.isMe && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleDeleteForAll(contextMenu.message.id)}
                    disabled={actioningId === contextMenu.message.id}
                    style={{ ...menuBtnStyle, cursor: actioningId === contextMenu.message.id ? 'wait' : 'pointer' }}
                  >
                    <i className="fa-solid fa-trash" style={{ width: 16, opacity: 0.9 }} />
                    Удалить у всех
                  </button>
                )}
              </div>,
              document.body
            )}
            {toast && (
              <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 10000, padding: '10px 20px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8, boxShadow: 'var(--shadow-lg)', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {toast}
              </div>
            )}
            {otherTyping && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {otherUser?.name ?? 'Участник'} печатает…
              </div>
            )}
          </div>

          {videoRecording && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                background: 'rgba(0,0,0,0.85)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 24,
              }}
            >
              <div
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '4px solid var(--accent-primary)',
                  boxShadow: '0 0 0 4px rgba(255,255,255,0.2)',
                }}
              >
                <video
                  ref={videoPreviewRef}
                  muted
                  playsInline
                  autoPlay
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)',
                  }}
                />
              </div>
              <p style={{ color: 'white', fontSize: '0.95rem' }}>Идёт запись видеокружка</p>
              <button
                type="button"
                onClick={handleVideoRecord}
                style={{
                  padding: '12px 24px',
                  borderRadius: 24,
                  border: 'none',
                  background: 'var(--accent-red, #e53e3e)',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                Остановить
              </button>
            </div>
          )}

          {replyingTo && (
            <div style={{ marginBottom: 8, padding: '8px 12px', background: 'var(--bg-accent)', borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Ответ на сообщение</div>
                <div style={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{replyingTo.body.slice(0, 80)}{replyingTo.body.length > 80 ? '…' : ''}</div>
              </div>
              <button type="button" onClick={() => setReplyingTo(null)} style={{ padding: 4, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }} aria-label="Отмена">×</button>
            </div>
          )}
          {shareContent && shareSlug && (
            <div
              style={{
                marginBottom: 10,
                padding: 10,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-accent)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                Переслать материал
              </div>
              <Link
                href={`/universes/${encodeURIComponent(shareSlug)}/content/${encodeURIComponent(shareContent)}`}
                style={{
                  fontWeight: 600,
                  color: 'var(--accent-primary)',
                  textDecoration: 'none',
                  wordBreak: 'break-word',
                }}
              >
                {shareTitle ? decodeURIComponent(shareTitle) : 'Материал'}
              </Link>
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            {attachment && (
              <div style={{ marginBottom: 8, position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8, padding: 8, background: 'var(--bg-accent)', borderRadius: 8, margin: '0 20px 8px' }}>
                {attachment.type === 'image' ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={attachment.url} alt="" style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8, objectFit: 'cover' }} />
                ) : attachment.type === 'video' ? (
                  <video src={attachment.url} style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8 }} />
                ) : attachment.type === 'audio' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.2rem', color: 'var(--accent-primary)' }}><i className="fa-solid fa-microphone" /></span>
                    <audio src={attachment.url} controls style={{ maxWidth: 200, height: 32 }} />
                  </div>
                ) : (
                  <span style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}>
                    <i className="fa-solid fa-file-zipper" />
                  </span>
                )}
                {attachment.type === 'file' && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {attachment.filename || 'Файл'}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, border: 'none', background: 'rgba(0,0,0,0.6)', color: 'white', cursor: 'pointer', fontSize: 14 }}
                  aria-label="Удалить"
                >
                  ×
                </button>
              </div>
            )}
            <div className="flex flex-col md:flex-row gap-2 items-end w-full max-w-5xl mx-auto px-4 py-3 pb-6 md:pb-4 border-top border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--bg-primary)_80%,transparent)] backdrop-blur-xl">
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
              
              <div
                className="flex items-center w-full bg-[var(--bg-accent)] border border-[var(--border-subtle)] transition-all focus-within:border-[var(--accent-primary)] focus-within:shadow-[0_0_0_1px_var(--accent-primary)]"
                style={{ borderRadius: 24, padding: '4px 6px' }}
              >
                {/* Вложения (внутри инпута слева) */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setPlusOpen((v) => !v)}
                    title="Вложения"
                    className={`text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center${plusOpen ? ' text-[var(--accent-primary)]' : ''}`}
                    aria-expanded={plusOpen}
                    style={{ width: 36, height: 36, borderRadius: '50%' }}
                  >
                    <i className="fa-solid fa-paperclip text-lg" />
                  </button>
                  {plusOpen && (
                    <div
                      className="chat-attachments-menu chat-popup-glass"
                      style={{
                        position: 'absolute',
                        bottom: '120%',
                        left: 0,
                        padding: 8,
                        display: 'flex',
                        flexDirection: 'row',
                        gap: 8,
                        zIndex: 40,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => { setPlusOpen(false); fileInputRef.current?.click(); }}
                        className="chat-attachments-item hover:bg-[var(--hover-color)] p-2 rounded-xl transition-colors"
                        aria-label="Фото или файл"
                      >
                        <i className="fa-solid fa-image fa-fw text-xl text-[var(--text-primary)]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPlusOpen(false); handleVideoRecord(); }}
                        className="chat-attachments-item hover:bg-[var(--hover-color)] p-2 rounded-xl transition-colors"
                        aria-label="Видеокружок"
                      >
                        <i className="fa-solid fa-video fa-fw text-xl text-[var(--text-primary)]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPlusOpen(false); handleVoiceRecord(); }}
                        className="chat-attachments-item hover:bg-[var(--hover-color)] p-2 rounded-xl transition-colors"
                        aria-label="Голосовое сообщение"
                      >
                        <i className="fa-solid fa-microphone fa-fw text-xl text-[var(--text-primary)]" />
                      </button>
                      <GifPicker
                        onPick={(url) => { setAttachment({ url, type: 'image' }); setPlusOpen(false); }}
                      >
                        <div
                          className="chat-attachments-item flex items-center hover:bg-[var(--hover-color)] p-2 rounded-xl transition-colors cursor-pointer text-xl font-bold text-[var(--text-primary)]"
                        >
                          GIF
                        </div>
                      </GifPicker>
                    </div>
                  )}
                </div>

                {/* Поле ввода текста */}
                <input
                  type="text"
                  value={inputValue}
                  onPaste={handlePaste}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    emitTyping();
                    if (typingStopRef.current) clearTimeout(typingStopRef.current);
                    typingStopRef.current = setTimeout(emitTypingStop, 2000);
                  }}
                  onFocus={() => {
                    if (userId) {
                      fetch(`/api/me/conversations/${encodeURIComponent(userId)}/read`, { method: 'PATCH', credentials: 'include' })
                        .then((r) => { if (r.ok) window.dispatchEvent(new CustomEvent('messages-badge-refresh')); })
                        .catch(() => {});
                    }
                  }}
                  onBlur={emitTypingStop}
                  placeholder="Сообщение…"
                  maxLength={8192}
                  disabled={sending}
                  style={{ fontSize: 16 }}
                  className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] px-3 py-2 placeholder-[var(--text-muted)] min-w-0"
                />

                {/* Эмодзи (справа в инпуте) */}
                <EmojiPicker onPick={(emoji) => setInputValue((v) => v + emoji)}>
                  <div className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center cursor-pointer" style={{ width: 36, height: 36 }}>
                    <i className="fa-regular fa-face-smile text-xl" />
                  </div>
                </EmojiPicker>

                {/* Кнопка отправки (пропадает/меняется или просто иконка) */}
                <button
                  type="submit"
                  disabled={sending || (!inputValue.trim() && !attachment)}
                  className="ml-1 flex items-center justify-center transition-all"
                  style={{
                    width: 36, height: 36,
                    borderRadius: '50%',
                    background: (inputValue.trim() || attachment) ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    opacity: (inputValue.trim() || attachment) ? 1 : 0.5,
                    color: (inputValue.trim() || attachment) ? '#fff' : 'var(--text-secondary)',
                    pointerEvents: (inputValue.trim() || attachment) ? 'auto' : 'none',
                  }}
                >
                  {sending ? (
                    <i className="fa-solid fa-circle-notch fa-spin" />
                  ) : (
                    <i className="fa-solid fa-paper-plane text-sm" style={{ marginLeft: -2 }} />
                  )}
                </button>
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
