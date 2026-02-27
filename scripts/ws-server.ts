/**
 * WebSocket-сервер для real-time обновлений комнат и DM (Socket.io).
 * Запуск: npm run ws или tsx scripts/ws-server.ts
 *
 * - Клиенты подключаются; при auth token входят в user:{userId}.
 * - API вызывает POST /notify (roomId или targetType:user + targetId).
 */
import 'dotenv/config';
import { createServer } from 'http';
import { createHmac, timingSafeEqual } from 'crypto';
import { Server } from 'socket.io';

const PORT = parseInt(process.env.WS_PORT ?? '3002', 10);
const AUTH_SECRET = process.env.AUTH_SECRET ?? process.env.WS_AUTH_SECRET ?? 'dev-secret-change-in-prod';
const NOTIFY_SECRET = process.env.WS_NOTIFY_SECRET;

function base64UrlDecode(str: string): Buffer {
  const padding = (4 - (str.length % 4)) % 4;
  const base64 = (str + '='.repeat(padding)).replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64');
}

function verifyWsToken(token: string): string | null {
  try {
    const [payloadB64, sigB64] = token.split('.');
    if (!payloadB64 || !sigB64) return null;
    const expectedSig = createHmac('sha256', AUTH_SECRET).update(payloadB64).digest();
    const actualSig = base64UrlDecode(sigB64);
    if (expectedSig.length !== actualSig.length || !timingSafeEqual(expectedSig, actualSig)) return null;
    const payload = JSON.parse(Buffer.from(base64UrlDecode(payloadB64)).toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload.userId ?? null;
  } catch {
    return null;
  }
}

const httpServer = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/notify') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        if (NOTIFY_SECRET) {
          const secret = req.headers['x-notify-secret'] as string | undefined;
          if (secret !== NOTIFY_SECRET) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
          }
        }
        const json = JSON.parse(body || '{}');
        const { roomId, targetType, targetId, event, data } = json;
        const targetRoom = targetType === 'user' && targetId
          ? `user:${targetId}`
          : roomId;
        if (targetRoom && event && io) {
          io.to(targetRoom).emit(event, data ?? {});
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON or missing target/event' }));
      }
    });
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

function contentRoom(contentId: string): string {
  return `content:${contentId}`;
}

function universeRoom(slug: string): string {
  return `universe:${slug}`;
}

const contentPresence = new Map<string, Map<string, { userId: string; userName: string | null }>>();
const universePresence = new Map<string, Map<string, { userId: string; userName: string | null }>>();

function getContentPresenceList(contentId: string): Array<{ userId: string; userName: string | null }> {
  const bySocket = contentPresence.get(contentId);
  if (!bySocket) return [];
  return Array.from(bySocket.values());
}

function broadcastContentPresence(contentId: string) {
  const list = getContentPresenceList(contentId);
  io.to(contentRoom(contentId)).emit('presence_list', { users: list });
}

function getUniversePresenceList(slug: string): Array<{ userId: string; userName: string | null }> {
  const bySocket = universePresence.get(slug);
  if (!bySocket) return [];
  return Array.from(bySocket.values());
}

function broadcastUniversePresence(slug: string) {
  const list = getUniversePresenceList(slug);
  io.to(universeRoom(slug)).emit('universe_presence_list', { users: list });
}

io.on('connection', (socket) => {
  const token = (socket.handshake.auth as { token?: string })?.token;
  if (token) {
    const userId = verifyWsToken(token);
    if (userId) {
      socket.join(`user:${userId}`);
      (socket.data as { userId?: string }).userId = userId;
    }
  }

  socket.on('dm_typing', (payload: { toUserId?: string; userName?: string | null }) => {
    const toUserId = payload?.toUserId;
    const myUserId = (socket.data as { userId?: string }).userId;
    if (toUserId && typeof toUserId === 'string' && myUserId) {
      io.to(`user:${toUserId}`).emit('dm_typing', { userId: myUserId, userName: payload?.userName ?? null });
    }
  });
  socket.on('dm_typing_stop', (payload: { toUserId?: string }) => {
    const toUserId = payload?.toUserId;
    const myUserId = (socket.data as { userId?: string }).userId;
    if (toUserId && typeof toUserId === 'string' && myUserId) {
      io.to(`user:${toUserId}`).emit('dm_typing_stop', { userId: myUserId });
    }
  });

  socket.on('join_room', (payload: { roomId: string }) => {
    const roomId = payload?.roomId;
    if (roomId && typeof roomId === 'string') {
      socket.join(roomId);
    }
  });

  socket.on('leave_room', (payload: { roomId: string }) => {
    const roomId = payload?.roomId;
    if (roomId && typeof roomId === 'string') {
      socket.leave(roomId);
    }
  });

  socket.on('playback_state', (payload: { roomId: string; currentTime?: number; playing?: boolean }) => {
    const roomId = payload?.roomId;
    if (roomId && typeof roomId === 'string') {
      socket.to(roomId).emit('playback_state', {
        currentTime: payload?.currentTime,
        playing: payload?.playing,
      });
    }
  });

  const voiceEvent = (event: string) => (payload: { roomId?: string; fromUserId?: string; toUserId?: string; sdp?: object; candidate?: object }) => {
    const roomId = payload?.roomId;
    if (roomId && typeof roomId === 'string') {
      io.to(roomId).emit(event, payload);
    }
  };
  socket.on('voice_offer', voiceEvent('voice_offer'));
  socket.on('voice_answer', voiceEvent('voice_answer'));
  socket.on('voice_ice', voiceEvent('voice_ice'));
  socket.on('voice_request_offer', voiceEvent('voice_request_offer'));
  socket.on('voice_activity', (payload: { roomId?: string; userId?: string; speaking?: boolean }) => {
    const roomId = payload?.roomId;
    if (roomId && typeof roomId === 'string') {
      io.to(roomId).emit('voice_activity', { userId: payload?.userId, speaking: payload?.speaking });
    }
  });
  socket.on('voice_muted', (payload: { roomId?: string; userId?: string; muted?: boolean }) => {
    const roomId = payload?.roomId;
    if (roomId && typeof roomId === 'string') {
      io.to(roomId).emit('voice_muted', { userId: payload?.userId, muted: payload?.muted });
    }
  });
  socket.on('room_mute_user', (payload: { roomId?: string; targetUserId?: string }) => {
    const roomId = payload?.roomId;
    if (roomId && typeof roomId === 'string' && payload?.targetUserId) {
      io.to(roomId).emit('room_mute_user', { targetUserId: payload.targetUserId });
    }
  });
  socket.on('room_mute_all', (payload: { roomId?: string }) => {
    const roomId = payload?.roomId;
    if (roomId && typeof roomId === 'string') {
      io.to(roomId).emit('room_mute_all', {});
    }
  });

  socket.on('hand_raised', (payload: { roomId?: string; userId?: string; raised?: boolean }) => {
    const roomId = payload?.roomId;
    if (roomId && typeof roomId === 'string') {
      io.to(roomId).emit('hand_raised', { userId: payload?.userId, raised: payload?.raised !== false });
    }
  });

  socket.on('round_leader_chosen', (payload: { roomId?: string; leaderUserId?: string }) => {
    const roomId = payload?.roomId;
    if (roomId && typeof roomId === 'string' && payload?.leaderUserId) {
      io.to(roomId).emit('round_leader_chosen', { leaderUserId: payload.leaderUserId });
    }
  });

  socket.on('join_content', (payload: { contentId: string; userId?: string; userName?: string | null }) => {
    const id = payload?.contentId;
    const userId = payload?.userId;
    const userName = payload?.userName ?? null;
    if (id && typeof id === 'string') {
      socket.join(contentRoom(id));
      if (userId) {
        if (!contentPresence.has(id)) contentPresence.set(id, new Map());
        contentPresence.get(id)!.set(socket.id, { userId, userName });
        broadcastContentPresence(id);
      }
    }
  });

  socket.on('leave_content', (payload: { contentId: string }) => {
    const id = payload?.contentId;
    if (id && typeof id === 'string') {
      const bySocket = contentPresence.get(id);
      if (bySocket) {
        bySocket.delete(socket.id);
        if (bySocket.size === 0) contentPresence.delete(id);
        broadcastContentPresence(id);
      }
      socket.leave(contentRoom(id));
    }
  });

  socket.on('typing_start', (payload: { contentId: string; userId: string; userName: string | null }) => {
    const { contentId, userId, userName } = payload ?? {};
    if (contentId && typeof contentId === 'string' && userId) {
      socket.to(contentRoom(contentId)).emit('user_typing', { userId, userName: userName ?? null });
    }
  });

  socket.on('typing_stop', (payload: { contentId: string; userId: string; userName: string | null }) => {
    const { contentId, userId, userName } = payload ?? {};
    if (contentId && typeof contentId === 'string' && userId) {
      socket.to(contentRoom(contentId)).emit('user_stopped_typing', { userId, userName: userName ?? null });
    }
  });

  socket.on('join_universe', (payload: { slug: string; userId?: string; userName?: string | null }) => {
    const slug = payload?.slug;
    const userId = payload?.userId;
    const userName = payload?.userName ?? null;
    if (slug && typeof slug === 'string') {
      socket.join(universeRoom(slug));
      if (userId) {
        if (!universePresence.has(slug)) universePresence.set(slug, new Map());
        universePresence.get(slug)!.set(socket.id, { userId, userName });
        broadcastUniversePresence(slug);
      }
    }
  });

  socket.on('leave_universe', (payload: { slug: string }) => {
    const slug = payload?.slug;
    if (slug && typeof slug === 'string') {
      const bySocket = universePresence.get(slug);
      if (bySocket) {
        bySocket.delete(socket.id);
        if (bySocket.size === 0) universePresence.delete(slug);
        broadcastUniversePresence(slug);
      }
      socket.leave(universeRoom(slug));
    }
  });

  socket.on('disconnect', () => {
    for (const [contentId, bySocket] of contentPresence.entries()) {
      if (bySocket.has(socket.id)) {
        bySocket.delete(socket.id);
        if (bySocket.size === 0) contentPresence.delete(contentId);
        broadcastContentPresence(contentId);
        break;
      }
    }
    for (const [slug, bySocket] of universePresence.entries()) {
      if (bySocket.has(socket.id)) {
        bySocket.delete(socket.id);
        if (bySocket.size === 0) universePresence.delete(slug);
        broadcastUniversePresence(slug);
        break;
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`[ws-server] Socket.io listening on port ${PORT}`);
  console.log(`[ws-server] Notify: POST http://localhost:${PORT}/notify with body: { roomId, event, data }`);
});
