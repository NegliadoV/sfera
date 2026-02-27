'use client';

import { useState } from 'react';

type Provider = 'rss' | 'youtube' | 'podcast' | 'telegram' | 'manual';

export function AddUserSourceForm({ onAdded }: { onAdded: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [provider, setProvider] = useState<Provider>('rss');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const providers: { value: Provider; label: string }[] = [
    { value: 'rss', label: 'RSS' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'podcast', label: 'Подкаст' },
    { value: 'telegram', label: 'Telegram' },
    { value: 'manual', label: 'Вручную' },
  ];

  const submit = async () => {
    if (!name.trim()) {
      setError('Название обязательно');
      return;
    }
    if (provider !== 'manual' && !url.trim()) {
      setError('URL обязателен');
      return;
    }
    setPending(true);
    setError('');
    try {
      const res = await fetch('/api/me/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ provider, name: name.trim(), url: url.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Ошибка');
        return;
      }
      setName('');
      setUrl('');
      setShowForm(false);
      onAdded();
    } catch {
      setError('Ошибка сети');
    } finally {
      setPending(false);
    }
  };

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="sidebar-create-sphere-btn"
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px dashed var(--border-color)',
          background: 'transparent',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <i className="fas fa-plus" />
        Добавить источник
      </button>
    );
  }

  return (
    <div style={{ padding: 12, background: 'var(--studio-participant-bg)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
      <select
        value={provider}
        onChange={(e) => setProvider(e.target.value as Provider)}
        style={{
          width: '100%',
          marginBottom: 8,
          padding: '8px 10px',
          borderRadius: 8,
          border: '1px solid var(--border-color)',
          fontSize: '0.85rem',
          background: 'var(--studio-panel-bg)',
          color: 'var(--text-primary)',
        }}
      >
        {providers.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Название"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{
          width: '100%',
          marginBottom: 8,
          padding: '8px 10px',
          borderRadius: 8,
          border: '1px solid var(--border-color)',
          fontSize: '0.85rem',
          background: 'var(--studio-panel-bg)',
          color: 'var(--text-primary)',
        }}
      />
      {provider !== 'manual' && (
        <input
          type="text"
          placeholder="URL (RSS, канал и т.д.)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            width: '100%',
            marginBottom: 8,
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid var(--border-color)',
            fontSize: '0.85rem',
            background: 'var(--studio-panel-bg)',
            color: 'var(--text-primary)',
          }}
        />
      )}
      {error && <p style={{ fontSize: '0.8rem', color: 'var(--text-danger)', marginBottom: 8 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--accent-primary)',
            color: 'var(--accent-primary-foreground)',
            fontSize: '0.85rem',
            cursor: pending ? 'wait' : 'pointer',
          }}
        >
          {pending ? '…' : 'Добавить'}
        </button>
        <button
          type="button"
          onClick={() => { setShowForm(false); setError(''); setName(''); setUrl(''); }}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid var(--border-color)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
