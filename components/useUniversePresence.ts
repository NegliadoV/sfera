'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3002';

export type PresenceUser = { userId: string; userName: string | null };

export function useUniversePresence(
  slug: string,
  currentUser: { userId: string; userName: string | null } | null
) {
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    const socket = io(WS_URL, { path: '/socket.io', transports: ['websocket', 'polling'] });
    socket.emit('join_universe', {
      slug,
      userId: currentUser?.userId,
      userName: currentUser?.userName ?? null,
    });

    socket.on('universe_presence_list', (data: { users: PresenceUser[] }) => {
      const list = Array.isArray(data?.users) ? data.users : [];
      setPresenceUsers(list.filter((u) => u.userId !== currentUser?.userId));
    });

    return () => {
      socket.emit('leave_universe', { slug });
      socket.removeAllListeners();
      setTimeout(() => socket.disconnect(), 50);
    };
  }, [slug, currentUser?.userId, currentUser?.userName]);

  return presenceUsers;
}
