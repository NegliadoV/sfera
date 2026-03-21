import { Config } from '@/constants/Config';
import { getToken } from '@/lib/authStorage';

const API_TIMEOUT_MS = 20000;

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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), init.signal ? undefined : API_TIMEOUT_MS);
  const signal = init.signal ?? controller.signal;
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers, signal });
  } catch (e) {
    clearTimeout(timeoutId);
    if (e instanceof Error) {
      if (e.name === 'AbortError') throw new Error('Нет ответа от сервера. Проверьте интернет и EXPO_PUBLIC_API_URL.');
      if (e.message?.includes('Network') || e.message?.includes('fetch')) throw new Error('Нет связи с сервером. Проверьте интернет и настройки API.');
    }
    throw e;
  }
  clearTimeout(timeoutId);
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

export async function register(email: string, password: string, name?: string, userTag?: string) {
  const data = await apiRequest<{ ok: boolean; user: { id: string; email: string | null; name: string | null; userTag?: string | null } }>(
    '/api/auth/register',
    {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim(),
        password,
        name: name?.trim() || undefined,
        userTag: userTag?.trim().replace(/^@+/, '') || undefined,
      }),
      skipAuth: true,
    }
  );
  return data;
}
