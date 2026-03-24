'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

const USER_TAG_HINT = 'Латиница, цифры или подчёркивание, 3–30 символов. По нему вас смогут найти в друзья.';

// Простая функция оценки надежности пароля (от 0 до 5)
function getPasswordStrength(pwd: string) {
  let score = 0;
  if (!pwd) return score;
  if (pwd.length >= 8) score += 1;
  if (pwd.length >= 12) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
  return Math.min(5, score);
}

const STRENGTH_COLORS = ['#333', '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981'];
const STRENGTH_LABELS = ['', 'Слабый', 'Нормальный', 'Хороший', 'Надежный', 'Монолитный'];

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [userTag, setUserTag] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState('');

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Пароли не совпадают!');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          userTag: userTag.trim().replace(/^@+/, '') || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? 'Ошибка отправки кода');
        setLoading(false);
        return;
      }
      setStep(2); // Переходим на шаг ввода кода
    } catch {
      setError('Ошибка отправки кода');
    }
    setLoading(false);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!code) return;
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
          code: code.trim(),
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

  if (step === 2) {
    return (
      <form onSubmit={handleRegister} className="w-full flex flex-col gap-4">
        <p className="text-sm text-center mb-4" style={{ color: 'var(--text-secondary)' }}>
          Мы отправили 6-значный код на <b>{email}</b>.<br />
          Введите его для завершения регистрации.
        </p>
        <div>
          <label htmlFor="code" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Код подтверждения
          </label>
          <input
            id="code"
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            required
            className="w-full px-4 py-3 text-center rounded-xl border text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary-muted)]"
            style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderColor: 'rgba(255,255,255,0.1)',
              color: 'var(--text-primary)',
            }}
            placeholder="000000"
          />
        </div>
        {error && (
          <p className="text-sm" style={{ color: 'var(--accent-red)' }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="glass-icon-btn w-full mt-4 flex items-center justify-center py-3.5 text-base font-semibold disabled:opacity-50 transition-all duration-300 hover:scale-[1.02]"
          style={{ background: 'var(--accent-primary)', border: 'none', color: '#fff' }}
        >
          {loading ? 'Проверка…' : 'Подтвердить и войти'}
        </button>
        <button
          type="button"
          onClick={() => setStep(1)}
          className="w-full mt-2 text-sm font-medium transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          Назад
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleRequestCode}
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
        {/* Индикатор пароля */}
        {password.length > 0 && (
          <div className="mt-2 w-full flex flex-col gap-1 transition-all duration-300">
            <div className="flex gap-1 w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              {[1, 2, 3, 4, 5].map((level) => {
                const strength = getPasswordStrength(password);
                const isActive = level <= strength;
                return (
                  <div
                    key={level}
                    className="h-full flex-1 transition-all duration-300"
                    style={{
                      backgroundColor: isActive ? STRENGTH_COLORS[strength] : 'transparent',
                    }}
                  />
                );
              })}
            </div>
            <p className="text-[11px] font-medium text-right transition-colors duration-300" style={{ color: STRENGTH_COLORS[getPasswordStrength(password)] }}>
              {STRENGTH_LABELS[getPasswordStrength(password)]}
            </p>
          </div>
        )}
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          Повторите пароль
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-4 py-3 rounded-xl border text-base sm:text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary-muted)] placeholder-gray-500"
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderColor: password && confirmPassword && password !== confirmPassword ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255,255,255,0.1)',
            color: 'var(--text-primary)',
            backdropFilter: 'blur(10px)',
          }}
          placeholder="Чтобы точно не ошибиться"
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
        {loading ? 'Отправка кода…' : 'Продолжить'}
      </button>
    </form>
  );
}
