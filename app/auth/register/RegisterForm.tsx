'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? 'Ошибка регистрации');
        setLoading(false);
        return;
      }
      router.push(`/auth/signin?registered=1&email=${encodeURIComponent(email.trim().toLowerCase())}`);
      return;
    } catch {
      setError('Ошибка регистрации');
    }
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm flex flex-col gap-4"
    >
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-[var(--radius-md)] border text-sm"
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          Пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-4 py-3 rounded-[var(--radius-md)] border text-sm"
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
          placeholder="не менее 8 символов"
        />
      </div>
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          Имя (необязательно)
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 rounded-[var(--radius-md)] border text-sm"
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
          placeholder="Как к вам обращаться"
        />
      </div>
      {error && (
        <p className="text-sm" style={{ color: 'var(--accent-red)' }}>
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 rounded-[var(--radius-lg)] font-medium text-white disabled:opacity-50"
        style={{ backgroundColor: 'var(--accent-green)' }}
      >
        {loading ? 'Регистрация…' : 'Зарегистрироваться'}
      </button>
    </form>
  );
}
