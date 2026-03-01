import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { StoredUser } from '@/lib/authStorage';
import * as authStorage from '@/lib/authStorage';
import { login as apiLogin, register as apiRegister } from '@/lib/api';
import { disconnectSocket } from '@/lib/socket';

type AuthState = {
  user: StoredUser | null;
  token: string | null;
  isLoading: boolean;
};

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStored = useCallback(async () => {
    try {
      const [t, u] = await Promise.all([authStorage.getToken(), authStorage.getStoredUser()]);
      setToken(t);
      setUser(u);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStored();
  }, [loadStored]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    const t = data?.token;
    const u = data?.user;
    if (!t || !u?.id) {
      throw new Error(
        'Сервер вернул неверный ответ. Убедитесь, что бэкенд запущен (npm run dev) и для seed выполнен npm run db:seed в корне проекта.'
      );
    }
    await authStorage.setToken(t);
    await authStorage.setStoredUser({
      id: u.id,
      email: u.email ?? null,
      name: u.name ?? null,
      image: u.image ?? null,
    });
    setToken(t);
    setUser({ id: u.id, email: u.email ?? null, name: u.name ?? null, image: u.image ?? null });
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    await apiRegister(email, password, name);
    const { token: t, user: u } = await apiLogin(email, password);
    await authStorage.setToken(t);
    await authStorage.setStoredUser({
      id: u.id,
      email: u.email ?? null,
      name: u.name ?? null,
      image: u.image ?? null,
    });
    setToken(t);
    setUser({ id: u.id, email: u.email ?? null, name: u.name ?? null, image: u.image ?? null });
  }, []);

  const logout = useCallback(async () => {
    disconnectSocket();
    await authStorage.clearAuth();
    setToken(null);
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
