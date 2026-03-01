import { io, Socket } from 'socket.io-client';
import { Config } from '@/constants/Config';
import { apiRequest } from '@/lib/api';

let cachedSocket: Socket | null = null;
let cachedWsToken: string | null = null;

/** Get a short-lived WebSocket token from the API (uses Bearer JWT). */
export async function getWsToken(): Promise<string> {
  const data = await apiRequest<{ token: string }>('/api/me/ws-token');
  if (!data?.token) throw new Error('No ws token');
  return data.token;
}

/**
 * Create a Socket.IO client authenticated with ws-token.
 * Call getWsToken() first (uses Bearer JWT from storage).
 */
export function createSocket(wsToken: string): Socket {
  const socket = io(Config.wsURL, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: { token: wsToken },
  });
  return socket;
}

/**
 * Get or create a shared socket. Connects with current JWT (fetches ws-token).
 * Call disconnectSocket() on logout.
 */
export async function getConnectedSocket(): Promise<Socket> {
  if (cachedSocket?.connected) return cachedSocket;
  if (cachedSocket) {
    cachedSocket.removeAllListeners();
    cachedSocket.disconnect();
    cachedSocket = null;
  }
  const token = await getWsToken();
  cachedWsToken = token;
  const socket = createSocket(token);
  cachedSocket = socket;
  return new Promise((resolve, reject) => {
    const onConnect = () => {
      socket.off('connect_error', onError);
      resolve(socket);
    };
    const onError = (err: Error) => {
      socket.off('connect', onConnect);
      reject(err);
    };
    socket.once('connect', onConnect);
    socket.once('connect_error', onError);
  });
}

export function disconnectSocket(): void {
  if (cachedSocket) {
    cachedSocket.removeAllListeners();
    cachedSocket.disconnect();
    cachedSocket = null;
  }
  cachedWsToken = null;
}
