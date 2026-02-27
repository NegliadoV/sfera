'use client';

import { useState, useRef, useEffect } from 'react';
import { SourceCircle } from '@/components/aggregator/SourceCircle';

interface Source {
  id: string;
  provider: 'rss' | 'youtube' | 'podcast' | 'telegram' | 'manual';
  name: string;
  url?: string | null;
  enabled: boolean;
  lastFetchedAt?: Date | string | null;
}

interface SourcesManagerProps {
  universeSlug: string;
  universeId?: string;
  initialSources: Source[];
  canEdit?: boolean;
}

export function SourcesManager({ universeSlug, initialSources, canEdit = true }: SourcesManagerProps) {
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isClosingForm, setIsClosingForm] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    provider: 'rss' as 'rss' | 'youtube' | 'podcast' | 'telegram' | 'manual',
    name: '',
    url: '',
  });
  const [selectOpen, setSelectOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const providerOptions: { value: Source['provider']; label: string }[] = [
    { value: 'rss', label: 'RSS / Atom фид' },
    { value: 'youtube', label: 'YouTube канал' },
    { value: 'podcast', label: 'Подкаст (RSS)' },
    { value: 'telegram', label: 'Telegram канал / пост' },
    { value: 'manual', label: 'Ручной ввод' },
  ];

  useEffect(() => {
    if (!selectOpen) return;
    const handle = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) setSelectOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [selectOpen]);

  const addSource = async () => {
    if (!formData.name.trim()) {
      setError('Название обязательно');
      return;
    }

    if (formData.provider !== 'manual' && !formData.url.trim()) {
      setError('URL обязателен для этого типа источника');
      return;
    }

    setPending(true);
    setError('');

    try {
      const res = await fetch(`/api/universes/${universeSlug}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          provider: formData.provider,
          name: formData.name.trim(),
          url: formData.url.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error ?? (res.status === 401 ? 'Войдите в систему' : res.status === 403 ? 'Нет прав на эту сферу' : 'Ошибка создания источника');
        setError(msg);
        return;
      }

      const newSource = await res.json();
      setSources([...sources, newSource]);
      setFormData({ provider: 'rss', name: '', url: '' });
      setIsClosingForm(true);
    } catch {
      setError('Ошибка сети');
    } finally {
      setPending(false);
    }
  };

  const toggleSource = async (sourceId: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/universes/${universeSlug}/sources/${sourceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Ошибка обновления источника');
        return;
      }

      const updated = await res.json();
      setSources(sources.map((s) => (s.id === sourceId ? updated : s)));
    } catch {
      setError('Ошибка сети');
    }
  };

  const startAggregation = async () => {
    setPending(true);
    setError('');

    try {
      const res = await fetch(`/api/universes/${universeSlug}/aggregate`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error ?? (res.status === 401 ? 'Войдите в систему' : res.status === 403 ? 'Нет прав' : 'Ошибка запуска агрегации');
        setError(msg);
        return;
      }

      const data = await res.json().catch(() => ({}));
      const processed = data.processed ?? 0;
      alert(processed > 0
        ? `Агрегация завершена. Добавлено ${processed} новых записей.`
        : 'Агрегация завершена. Новых записей нет (все уже были в сфере или источники пусты).');
      window.location.reload();
    } catch {
      setError('Ошибка сети');
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      {!canEdit && (
        <div
          className="mb-4 p-3 rounded-[var(--radius-md)] text-sm"
          style={{
            backgroundColor: 'var(--bg-accent)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
          }}
        >
          Просмотр источников. Добавлять и изменять источники могут только владелец и модераторы сферы.{' '}
          <a href="/" className="underline hover:no-underline" style={{ color: 'var(--accent)' }}>
            Создайте свою сферу
          </a>
          , чтобы настраивать агрегатор.
        </div>
      )}
      <div className="mb-6">
        {canEdit && (
          <>
            <button
              onClick={() => {
                if (showAddForm) setIsClosingForm(true);
                else setShowAddForm(true);
              }}
              className="px-4 py-2 rounded-[var(--radius-md)] font-medium transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--bg-accent)',
                color: 'var(--text-primary)',
              }}
            >
              {showAddForm ? 'Отмена' : '+ Добавить источник'}
            </button>
            <button
              type="button"
              onClick={startAggregation}
              disabled={pending || sources.filter((s) => s.enabled).length === 0}
              className="add-content-form-submit ml-4"
              title={sources.filter((s) => s.enabled).length === 0 ? 'Включите хотя бы один источник (галочка «Активен»)' : undefined}
            >
              {pending ? 'Агрегация...' : 'Запустить агрегацию'}
            </button>
            {sources.length > 0 && sources.filter((s) => s.enabled).length === 0 && (
              <span className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Включите хотя бы один источник (галочка «Активен»).
              </span>
            )}
          </>
        )}
      </div>

      {error && (
        <div
          className="mb-4 p-3 rounded-[var(--radius-md)] text-sm"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--accent-red)',
          }}
        >
          {error}
        </div>
      )}

      {(showAddForm || isClosingForm) && (
        <div
          className={`neon-block mb-6 p-4 rounded-[var(--radius-md)] border ${isClosingForm ? 'sources-add-form-exit' : 'sources-add-form-enter'}`}
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border-color)',
          }}
          onAnimationEnd={() => {
            if (isClosingForm) {
              setIsClosingForm(false);
              setShowAddForm(false);
            }
          }}
        >
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Новый источник
          </h3>
          <div className="sources-add-form-form space-y-4">
            <div ref={selectRef} className="sources-add-form-select-wrap">
              <label className="sources-add-form-label">
                Тип источника
              </label>
              <button
                type="button"
                className={`sources-add-form-select-trigger ${selectOpen ? 'sources-add-form-select-trigger--open' : ''}`}
                onClick={() => setSelectOpen(!selectOpen)}
                aria-expanded={selectOpen}
                aria-haspopup="listbox"
                aria-label="Тип источника"
              >
                <span>{providerOptions.find((o) => o.value === formData.provider)?.label ?? formData.provider}</span>
                <svg className="sources-add-form-select-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M2 4l4 4 4-4" />
                </svg>
              </button>
              <div
                className={`sources-add-form-select-dropdown ${selectOpen ? 'sources-add-form-select-dropdown--open' : ''}`}
                role="listbox"
                aria-hidden={!selectOpen}
              >
                {providerOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={formData.provider === opt.value}
                    className={`sources-add-form-select-option ${formData.provider === opt.value ? 'sources-add-form-select-option--selected' : ''}`}
                    onClick={() => {
                      setFormData({ ...formData, provider: opt.value });
                      setSelectOpen(false);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="sources-add-form-label">
                Название источника
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например: ArXiv Physics"
                className="sources-add-form-input"
              />
            </div>
            {formData.provider !== 'manual' && (
              <div>
                <label className="sources-add-form-label">
                  URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder={
                    formData.provider === 'rss'
                      ? 'https://example.com/feed.xml'
                      : formData.provider === 'youtube'
                        ? 'https://youtube.com/@channel или channel ID'
                        : formData.provider === 'telegram'
                          ? 't.me/channel или @channel — последние 10 постов'
                          : 'https://example.com/podcast.xml'
                  }
                  className="sources-add-form-input"
                />
              </div>
            )}
            <button
              type="button"
              onClick={addSource}
              disabled={pending}
              className="sources-add-form-submit"
            >
              {pending ? 'Создание...' : 'Создать источник'}
            </button>
          </div>
        </div>
      )}

      {sources.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>
          Нет источников. Добавьте первый источник выше.
        </p>
      ) : (
        <div className="universes-grid">
          {sources.map((source) => (
            <SourceCircle
              key={source.id}
              id={source.id}
              name={source.name}
              provider={source.provider}
              url={source.url}
              enabled={source.enabled}
              canEdit={!!canEdit}
              universeSlug={universeSlug}
              onToggle={canEdit ? toggleSource : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
