/**
 * API and WebSocket base URLs. Override via env (EXPO_PUBLIC_API_URL) or EAS build.
 */
const getApiBase = () => {
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  return __DEV__ ? 'http://localhost:3000' : 'https://sfera.example.com';
};

const getWsBase = () => {
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_WS_URL) {
    const url = process.env.EXPO_PUBLIC_WS_URL.replace(/\/$/, '');
    // Socket.IO ждёт origin без path; path задаётся в socket.ts как /socket.io
    return url.replace(/\/socket\.io$/i, '');
  }
  const api = getApiBase();
  return api.replace(/^http/, 'ws');
};

export const Config = {
  apiBaseURL: getApiBase(),
  wsURL: getWsBase(),
};
