import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'sfera_jwt';
const USER_KEY = 'sfera_user';

export type StoredUser = {
  id: string;
  email: string | null;
  name: string | null;
  image?: string | null;
};

const isWeb = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

function getTokenWeb(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setTokenWeb(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

function removeTokenWeb(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

function getStoredUserWeb(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

function setStoredUserWeb(user: StoredUser): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

function removeStoredUserWeb(): void {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {}
}

export async function getToken(): Promise<string | null> {
  if (isWeb) return getTokenWeb();
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  if (isWeb) {
    setTokenWeb(token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  if (isWeb) {
    removeTokenWeb();
    return;
  }
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {}
}

export async function getStoredUser(): Promise<StoredUser | null> {
  if (isWeb) return getStoredUserWeb();
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export async function setStoredUser(user: StoredUser): Promise<void> {
  if (isWeb) {
    setStoredUserWeb(user);
    return;
  }
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function removeStoredUser(): Promise<void> {
  if (isWeb) {
    removeStoredUserWeb();
    return;
  }
  try {
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch {}
}

export async function clearAuth(): Promise<void> {
  await removeToken();
  await removeStoredUser();
}
