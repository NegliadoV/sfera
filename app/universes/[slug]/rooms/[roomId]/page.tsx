import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSessionForServerComponent } from '@/lib/session';
import { db, universes, rooms, roomRounds, roomParticipants, user, themes } from '@/lib/db';
import { eq, and, asc } from 'drizzle-orm';
import { normalizeUniverseSlug } from '@/lib/universe-slug';
import { RoomView } from './RoomView';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  waiting: 'Ожидание',
  ongoing: 'Идёт',
  finished: 'Завершена',
};

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; roomId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (searchParams) await searchParams;
  const { roomId } = await params;
  const slug = normalizeUniverseSlug((await params).slug);
  if (!slug) notFound();
  const [u] = await db.select().from(universes).where(eq(universes.slug, slug)).limit(1);
  if (!u) notFound();

  const [roomRow] = await db
    .select({
      id: rooms.id,
      universeId: rooms.universeId,
      themeId: rooms.themeId,
      themeName: themes.name,
      contentId: rooms.contentId,
      title: rooms.title,
      status: rooms.status,
      timeLimitMinutes: rooms.timeLimitMinutes,
      createdById: rooms.createdById,
      currentRoundIndex: rooms.currentRoundIndex,
      startedAt: rooms.startedAt,
      finishedAt: rooms.finishedAt,
      createdAt: rooms.createdAt,
      updatedAt: rooms.updatedAt,
    })
    .from(rooms)
    .leftJoin(themes, eq(rooms.themeId, themes.id))
    .where(and(eq(rooms.id, roomId), eq(rooms.universeId, u.id)))
    .limit(1);
  if (!roomRow) notFound();
  const room = { ...roomRow, themeName: roomRow.themeName ?? null };

  const [rounds, participants] = await Promise.all([
    db
      .select()
      .from(roomRounds)
      .where(eq(roomRounds.roomId, room.id))
      .orderBy(asc(roomRounds.orderIndex)),
    db
      .select({
        userId: roomParticipants.userId,
        joinedAt: roomParticipants.joinedAt,
        userName: user.name,
      })
      .from(roomParticipants)
      .leftJoin(user, eq(roomParticipants.userId, user.id))
      .where(eq(roomParticipants.roomId, room.id))
      .orderBy(asc(roomParticipants.joinedAt)),
  ]);

  const session = await getSessionForServerComponent();
  const currentUserId = session?.user?.id ?? null;
  const isParticipant = participants.some((p) => p.userId === currentUserId);
  const isCreator = room.createdById === currentUserId;

  const { themeName, ...roomPlain } = room;
  const roomData = {
    ...roomPlain,
    themeName: themeName ?? null,
    startedAt: room.startedAt?.toISOString() ?? null,
    finishedAt: room.finishedAt?.toISOString() ?? null,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
    rounds: rounds.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    participants: participants.map((p) => ({
      ...p,
      joinedAt: p.joinedAt.toISOString(),
    })),
  };

  return (
    <div className="platform-page">
      <div className="platform-breadcrumb mb-6">
        <Link href="/rooms">Комнаты</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <Link href={`/universes/${slug}`}>{u.name}</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <Link href={`/universes/${slug}/rooms`}>Сессии</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>{room.title}</span>
      </div>
      <div className="platform-card mb-8">
        <div className="platform-card-title" style={{ marginBottom: 8 }}>
          <i className="fa-solid fa-video" aria-hidden />
          {room.title}
          <span
            className="platform-tag"
            style={{
              marginLeft: 'auto',
              background: room.status === 'ongoing' ? 'var(--studio-status-live-bg)' : room.status === 'finished' ? 'rgba(255,255,255,0.06)' : 'rgba(62, 131, 255, 0.2)',
              borderColor: room.status === 'ongoing' ? 'var(--studio-status-live-border)' : 'rgba(255,255,255,0.1)',
              color: room.status === 'ongoing' ? 'var(--studio-status-live-color)' : 'var(--studio-meta-color)',
            }}
          >
            {STATUS_LABEL[room.status] ?? room.status}
          </span>
        </div>
        <p className="platform-card-desc mb-4">
          Сфера: <strong style={{ color: 'white' }}>{u.name}</strong>
          {room.themeName && (
            <> · Тема: <strong style={{ color: 'white' }}>{room.themeName}</strong></>
          )}
          {room.timeLimitMinutes != null && ` · Лимит ${room.timeLimitMinutes} мин`}
        </p>
        <RoomView
          slug={slug}
          roomId={room.id}
          room={roomData}
          currentUserId={currentUserId}
          isParticipant={isParticipant}
          isCreator={isCreator}
        />
      </div>
    </div>
  );
}
