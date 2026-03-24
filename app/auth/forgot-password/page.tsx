'use client';

import { useState } from 'react';
import Link from 'next/link';

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

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: email, 2: код и новый пароль, 3: успех
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка отправки кода');
      }
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !newPassword) return;
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают!');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка проверки кода');
      }
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full px-4 py-12">
      <div className="glass-panel w-full max-w-md p-6 sm:p-10 flex flex-col items-center">
        <h1 
          className="text-3xl font-bold mb-3 text-center w-full" 
          style={{ background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent-primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}
        >
          Сброс пароля
        </h1>
        <p className="text-center mb-8" style={{ color: 'var(--text-secondary)' }}>
          {step === 1 && 'Введите email, на который зарегистрирован аккаунт Roominate.'}
          {step === 2 && 'Проверьте почту. Мы отправили вам 6-значный код безопасности.'}
          {step === 3 && 'Пароль успешно изменен!'}
        </p>

        {error && (
          <div className="w-full mb-4 p-3 rounded-lg text-sm text-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)' }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={requestOTP} className="w-full flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Ваш Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary-muted)]"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}
                placeholder="you@email.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="glass-icon-btn w-full mt-4 flex items-center justify-center py-3.5 font-semibold transition-all duration-300 hover:scale-[1.02]"
              style={{ background: 'var(--accent-primary)', border: 'none', color: '#fff' }}
            >
              {loading ? 'Отправка...' : 'Отправить код'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={resetPassword} className="w-full flex flex-col gap-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                6-значный код
              </label>
              <input
                id="code"
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full px-4 py-3 text-center rounded-xl border text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary-muted)]"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}
                placeholder="000000"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Новый пароль
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary-muted)]"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}
                placeholder="Минимум 6 символов"
              />
              {/* Индикатор пароля */}
              {newPassword.length > 0 && (
                <div className="mt-2 w-full flex flex-col gap-1 transition-all duration-300">
                  <div className="flex gap-1 w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    {[1, 2, 3, 4, 5].map((level) => {
                      const strength = getPasswordStrength(newPassword);
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
                  <p className="text-[11px] font-medium text-right transition-colors duration-300" style={{ color: STRENGTH_COLORS[getPasswordStrength(newPassword)] }}>
                    {STRENGTH_LABELS[getPasswordStrength(newPassword)]}
                  </p>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Повторите новый пароль
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary-muted)]"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderColor: newPassword && confirmPassword && newPassword !== confirmPassword ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255,255,255,0.1)',
                  color: 'var(--text-primary)',
                }}
                placeholder="Чтобы точно не ошибиться"
              />
            </div>
            <button
              type="submit"
              disabled={loading || code.length !== 6 || newPassword.length < 6 || newPassword !== confirmPassword}
              className="glass-icon-btn w-full mt-4 flex items-center justify-center py-3.5 font-semibold transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
              style={{ background: 'var(--accent-primary)', border: 'none', color: '#fff' }}
            >
              {loading ? 'Проверка...' : 'Сохранить пароль'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="w-full flex flex-col items-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
              <i className="fa-solid fa-check text-2xl"></i>
            </div>
            <Link href="/auth/signin" className="glass-icon-btn w-full flex items-center justify-center py-3.5 font-semibold transition-all duration-300 hover:scale-[1.02]" style={{ background: 'var(--accent-primary)', border: 'none', color: '#fff' }}>
              Вернуться ко входу
            </Link>
          </div>
        )}

        {step !== 3 && (
          <p className="mt-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            Вспомнили пароль?{' '}
            <Link href="/auth/signin" className="font-semibold" style={{ color: 'var(--accent-primary)' }}>
              Войти
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
