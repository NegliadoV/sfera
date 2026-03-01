import { Config } from '@/constants/Config';
import { getToken } from '@/lib/authStorage';

type RequestOptions = RequestInit & { skipAuth?: boolean };

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth, ...init } = options;
  const url = path.startsWith('http') ? path : `${Config.apiBaseURL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) || {}),
  };
  if (!skipAuth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    let message = text || `HTTP ${res.status}`;
    try {
      const json = JSON.parse(text) as { error?: string };
      if (typeof json?.error === 'string') message = json.error;
    } catch {
      /* use raw text */
    }
    const err: Error & { status?: number } = new Error(message);
    err.status = res.status;
    throw err;
  }
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) return res.json() as Promise<T>;
  return res.text() as unknown as T;
}

export async function login(email: string, password: string) {
  const data = await apiRequest<{ token: string; user: { id: string; email: string | null; name: string | null; image?: string | null } }>(
    '/api/auth/mobile/login',
    {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password }),
      skipAuth: true,
    }
  );
  return data;
}

export async function register(email: string, password: string, name?: string) {
  const data = await apiRequest<{ ok: boolean; user: { id: string; email: string | null; name: string | null } }>(
    '/api/auth/register',
    {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password, name: name?.trim() || undefined }),
      skipAuth: true,
    }
  );
  return data;
}
