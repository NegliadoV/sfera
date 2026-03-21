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
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
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
          className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary-muted)] placeholder-gray-500"
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.1)',
            color: 'var(--text-primary)',
            backdropFilter: 'blur(10px)',
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
          className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary-muted)]"
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.1)',
            color: 'var(--text-primary)',
            backdropFilter: 'blur(10px)',
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
        className="glass-icon-btn w-full mt-4 flex items-center justify-center py-3.5 text-base font-semibold disabled:opacity-50 transition-all duration-300 hover:scale-[1.02]"
        style={{ background: 'var(--accent-primary)', boxShadow: '0 8px 32px var(--accent-primary-muted)', border: 'none', color: '#fff' }}
      >
        {loading ? 'Вход…' : 'Войти'}
      </button>
    </form>
  );
}
