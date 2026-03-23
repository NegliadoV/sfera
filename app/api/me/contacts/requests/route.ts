import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import {
  db,
  contactRequests,
  contacts,
  user,
} from '@/lib/db';
import { eq, or, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** Canonical pair: userIdA < userIdB */
function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/** GET /api/me/contacts/requests — входящие и исходящие запросы */
export async function GET(req: NextRequest) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const incoming = await db
      .select({
        id: contactRequests.id,
        fromUserId: contactRequests.fromUserId,
        status: contactRequests.status,
        createdAt: contactRequests.createdAt,
        fromUserName: user.name,
        fromUserImage: user.image,
        fromUserTag: user.userTag,
      })
      .from(contactRequests)
      .innerJoin(user, eq(contactRequests.fromUserId, user.id))
      .where(and(
        eq(contactRequests.toUserId, session.user.id),
        eq(contactRequests.status, 'pending')
      ));

    const outgoing = await db
      .select({
        id: contactRequests.id,
        toUserId: contactRequests.toUserId,
        status: contactRequests.status,
        createdAt: contactRequests.createdAt,
        toUserName: user.name,
        toUserImage: user.image,
      })
      .from(contactRequests)
      .innerJoin(user, eq(contactRequests.toUserId, user.id))
      .where(eq(contactRequests.fromUserId, session.user.id));

    return NextResponse.json({
      incoming: incoming.map((r) => ({
        id: r.id,
        fromUser: { id: r.fromUserId, name: r.fromUserName, image: r.fromUserImage, userTag: r.fromUserTag ?? null },
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      outgoing: outgoing.map((r) => ({
        id: r.id,
        toUser: { id: r.toUserId, name: r.toUserName, image: r.toUserImage },
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error('GET /api/me/contacts/requests', e);
    return NextResponse.json({ error: 'Failed to load requests' }, { status: 500 });
  }
}

/** POST /api/me/contacts/requests — отправить запрос в друзья */
export async function POST(req: NextRequest) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const toUserId = body?.toUserId as string | undefined;
    if (!toUserId || typeof toUserId !== 'string' || !toUserId.trim()) {
      return NextResponse.json({ error: 'toUserId required' }, { status: 400 });
    }

    const trimmed = toUserId.trim();
    if (trimmed === session.user.id) {
      return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 });
    }

    const [toUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, trimmed))
      .limit(1);
    if (!toUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [a, b] = canonicalPair(session.user.id, trimmed);

    const [existingContact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.userIdA, a), eq(contacts.userIdB, b)))
      .limit(1);
    if (existingContact) {
      return NextResponse.json({ error: 'Already in contacts' }, { status: 400 });
    }

    const [existingRequest] = await db
      .select()
      .from(contactRequests)
      .where(and(
        eq(contactRequests.fromUserId, session.user.id),
        eq(contactRequests.toUserId, trimmed),
        eq(contactRequests.status, 'pending')
      ))
      .limit(1);
    if (existingRequest) {
      return NextResponse.json({ error: 'Request already sent' }, { status: 400 });
    }

    const [inserted] = await db
      .insert(contactRequests)
      .values({
        fromUserId: session.user.id,
        toUserId: trimmed,
        status: 'pending',
      })
      .returning();

    return NextResponse.json({
      id: inserted.id,
      toUserId: trimmed,
      status: 'pending',
      createdAt: inserted.createdAt.toISOString(),
    });
  } catch (e) {
    console.error('POST /api/me/contacts/requests', e);
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 });
  }
}
