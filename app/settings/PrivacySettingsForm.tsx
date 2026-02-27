'use client';

import { useState, useEffect } from 'react';

export function PrivacySettingsForm() {
  const [dmOnlyContacts, setDmOnlyContacts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let c = false;
    fetch('/api/me/privacy', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => { if (!c && data.dmOnlyContacts !== undefined) setDmOnlyContacts(data.dmOnlyContacts); })
      .finally(() => { if (!c) setLoading(false); });
    return () => { c = true; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/me/privacy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ dmOnlyContacts }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Загрузка…</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="settings-checkbox-wrap">
        <input type="checkbox" checked={dmOnlyContacts} onChange={(e) => setDmOnlyContacts(e.target.checked)} className="settings-checkbox" />
        <span className="settings-checkbox-visual" aria-hidden />
        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Писать могут только друзья</span>
      </label>
      <p className="text-sm ml-8" style={{ color: 'var(--text-secondary)' }}>
        Если включено, личные сообщения смогут отправлять только пользователи из списка контактов.
      </p>
      <button type="submit" disabled={saving} className="platform-btn platform-btn-sm">{saving ? 'Сохранение…' : 'Сохранить'}</button>
      {saved && <span className="text-sm ml-2" style={{ color: 'var(--accent-green)' }}>Сохранено</span>}
    </form>
  );
}
