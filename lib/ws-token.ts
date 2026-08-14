import { createHmac, timingSafeEqual } from 'crypto';

const SECRET = process.env.AUTH_SECRET ?? process.env.WS_AUTH_SECRET ?? 'dev-secret-change-in-prod';
const TTL_SEC = 5 * 60; // 5 minutes
const ROOM_TICKET_TTL_SEC = 2 * 60; // 2 minutes

function base64UrlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Buffer {
  const padding = (4 - (str.length % 4)) % 4;
  const base64 = (str + '='.repeat(padding)).replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64');
}

/** Создать короткоживущий токен для WebSocket (только на сервере Next.js). */
export function createWsToken(userId: string): string {
  const payload = JSON.stringify({
    userId,
    exp: Math.floor(Date.now() / 1000) + TTL_SEC,
  });
  const payloadB64 = base64UrlEncode(Buffer.from(payload, 'utf8'));
  const sig = createHmac('sha256', SECRET).update(payloadB64).digest();
  const sigB64 = base64UrlEncode(sig);
  return `${payloadB64}.${sigB64}`;
}

/**
 * Проверить токен и вернуть userId. Для использования в ws-server (отдельный процесс).
 * ws-server должен иметь ту же AUTH_SECRET или WS_AUTH_SECRET в env.
 */
export function verifyWsToken(token: string): string | null {
  try {
    const [payloadB64, sigB64] = token.split('.');
    if (!payloadB64 || !sigB64) return null;

    const expectedSig = createHmac('sha256', SECRET).update(payloadB64).digest();
    const actualSig = base64UrlDecode(sigB64);
    if (expectedSig.length !== actualSig.length || !timingSafeEqual(expectedSig, actualSig)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(base64UrlDecode(payloadB64)).toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // expired
    }
    return payload.userId ?? null;
  } catch {
    return null;
  }
}

/**
 * Создаёт подписанный тикет доступа в конкретную комнату (room ticket).
 * Живёт 2 минуты. Выдаётся API-роутом после проверки прав в БД.
 * WS-сервер верифицирует его без обращения к БД.
 */
export function createRoomTicket(userId: string, roomId: string): string {
  const payload = JSON.stringify({
    userId,
    roomId,
    exp: Math.floor(Date.now() / 1000) + ROOM_TICKET_TTL_SEC,
  });
  const payloadB64 = base64UrlEncode(Buffer.from(payload, 'utf8'));
  const sig = createHmac('sha256', SECRET).update(payloadB64).digest();
  const sigB64 = base64UrlEncode(sig);
  return `${payloadB64}.${sigB64}`;
}

/** Верифицирует room ticket и возвращает { userId, roomId } или null при ошибке/просрочке. */
export function verifyRoomTicket(ticket: string): { userId: string; roomId: string } | null {
  try {
    const [payloadB64, sigB64] = ticket.split('.');
    if (!payloadB64 || !sigB64) return null;

    const expectedSig = createHmac('sha256', SECRET).update(payloadB64).digest();
    const actualSig = base64UrlDecode(sigB64);
    if (expectedSig.length !== actualSig.length || !timingSafeEqual(expectedSig, actualSig)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(base64UrlDecode(payloadB64)).toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // expired
    }
    if (!payload.userId || !payload.roomId) return null;
    return { userId: payload.userId, roomId: payload.roomId };
  } catch {
    return null;
  }
}
