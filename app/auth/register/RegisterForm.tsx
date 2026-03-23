'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

const USER_TAG_HINT = 'Латиница, цифры или подчёркивание, 3–30 символов. По нему вас смогут найти в друзья.';

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userTag, setUserTag] = useState('');
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
          userTag: userTag.trim().replace(/^@+/, '') || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? 'Ошибка регистрации');
        setLoading(false);
        return;
      }
      
      const signRes = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (signRes?.ok) {
        window.location.href = '/universes';
      } else {
        router.push(`/auth/signin?registered=1&email=${encodeURIComponent(email.trim().toLowerCase())}`);
      }
      return;
    } catch {
      setError('Ошибка регистрации');
    }
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full flex flex-col gap-4"
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
          className="w-full px-4 py-3 rounded-xl border text-base sm:text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary-muted)] placeholder-gray-500"
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
        <label htmlFor="userTag" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          Ник (@ник)
        </label>
        <input
          id="userTag"
          name="userTag"
          type="text"
          autoComplete="username"
          value={userTag}
          onChange={(e) => setUserTag(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl border text-base sm:text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary-muted)] placeholder-gray-500"
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.1)',
            color: 'var(--text-primary)',
            backdropFilter: 'blur(10px)',
          }}
          placeholder="mynick или my_nick"
        />
        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          {USER_TAG_HINT}
        </p>
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
          className="w-full px-4 py-3 rounded-xl border text-base sm:text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary-muted)] placeholder-gray-500"
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.1)',
            color: 'var(--text-primary)',
            backdropFilter: 'blur(10px)',
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
          className="w-full px-4 py-3 rounded-xl border text-base sm:text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary-muted)] placeholder-gray-500"
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.1)',
            color: 'var(--text-primary)',
            backdropFilter: 'blur(10px)',
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
        className="glass-icon-btn w-full mt-4 flex items-center justify-center py-3.5 text-base font-semibold disabled:opacity-50 transition-all duration-300 hover:scale-[1.02]"
        style={{ background: 'var(--accent-primary)', boxShadow: '0 8px 32px var(--accent-primary-muted)', border: 'none', color: '#fff' }}
      >
        {loading ? 'Регистрация…' : 'Зарегистрироваться'}
      </button>
    </form>
  );
}
