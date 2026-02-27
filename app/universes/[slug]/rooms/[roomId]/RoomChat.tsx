'use client';

import { useRef, useEffect } from 'react';

export type RoomChatMessageItem = {
  id: string;
  userId: string;
  userName: string | null;
  body: string;
  createdAt: string;
};

export function RoomChat({
  messages,
  onSendMessage,
  currentUserId,
  isParticipant,
  sendLoading,
}: {
  messages: RoomChatMessageItem[];
  onSendMessage: (body: string) => Promise<void>;
  currentUserId: string | null;
  slug: string;
  roomId: string;
  isParticipant: boolean;
  sendLoading: boolean;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = formRef.current;
    if (!form || !isParticipant || sendLoading) return;
    const input = form.querySelector<HTMLInputElement>('input[name="body"]');
    const body = input?.value?.trim();
    if (!body) return;
    input!.value = '';
    await onSendMessage(body);
  }

  return (
    <div className="flex flex-col h-full min-h-[200px] rounded-[var(--radius-lg)] border overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="px-3 py-2 border-b shrink-0" style={{ borderColor: 'var(--border-color)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Чат раунда
        </h3>
      </div>
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0"
      >
        {messages.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Пока нет сообщений.
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="text-sm"
            >
              <span className="font-medium" style={{ color: msg.userId === currentUserId ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                {msg.userId === currentUserId ? 'Вы' : (msg.userName ?? msg.userId.slice(0, 8))}:
              </span>{' '}
              <span style={{ color: 'var(--text-secondary)' }}>{msg.body}</span>
            </div>
          ))
        )}
      </div>
      {isParticipant && currentUserId && (
        <form ref={formRef} onSubmit={handleSubmit} className="p-2 border-t shrink-0 chat-form-mobile" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              name="body"
              placeholder="Сообщение…"
              maxLength={2000}
              className="flex-1 px-3 py-2 rounded-[var(--radius-md)] border text-sm"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              disabled={sendLoading}
            />
            <button
              type="submit"
              disabled={sendLoading}
              className="px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}
            >
              {sendLoading ? '…' : 'Отправить'}
            </button>
          </div>
        </form>
      )}
      {!isParticipant && (
        <div className="px-3 py-2 border-t text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
          Войдите в комнату, чтобы писать в чат.
        </div>
      )}
    </div>
  );
}
