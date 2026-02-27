'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

export function SignInForm({
  callbackUrl,
  defaultEmail,
}: {
  callbackUrl: string;
  defaultEmail: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError('Неверный email или пароль');
        setLoading(false);
        return;
      }
      // После успешного входа редиректим на callbackUrl или на страницу вселенных
      if (res?.ok || res?.url) {
        window.location.href = res?.url || callbackUrl || '/';
      }
    } catch {
      setError('Ошибка входа');
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-[var(--radius-md)] border text-sm"
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
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
        style={{ backgroundColor: 'var(--accent-blue)' }}
      >
        {loading ? 'Вход…' : 'Войти'}
      </button>
    </form>
  );
}
