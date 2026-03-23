'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function MindMapCreateButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/me/mind-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Новая ментальная карта' })
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/me/mind-maps/${data.id}`);
      } else {
        alert('Ошибка при создании карты');
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка при создании карты');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleCreate} 
      disabled={loading}
      className="btn-glow flex items-center gap-2"
      style={{
        background: 'var(--accent-primary)',
        color: 'white',
        padding: '10px 24px',
        borderRadius: '12px',
        fontWeight: 600,
        boxShadow: '0 4px 20px rgba(var(--accent-primary-rgb, 100,200,100), 0.4)'
      }}
    >
      {loading ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-plus" />}
      Создать новую карту
    </button>
  );
}
