import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, contactRequests, contacts } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** Canonical pair: userIdA < userIdB */
function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/** PATCH /api/me/contacts/requests/[id] — принять или отклонить входящий запрос */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Request id required' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const action = body?.action as string | undefined;
    if (action !== 'accept' && action !== 'decline') {
      return NextResponse.json({ error: 'action must be "accept" or "decline"' }, { status: 400 });
    }

    const [request] = await db
      .select()
      .from(contactRequests)
      .where(and(
        eq(contactRequests.id, id),
        eq(contactRequests.toUserId, session.user.id),
        eq(contactRequests.status, 'pending')
      ))
      .limit(1);

    if (!request) {
      return NextResponse.json({ error: 'Request not found or already processed' }, { status: 404 });
    }

    if (action === 'decline') {
      await db
        .update(contactRequests)
        .set({ status: 'declined' })
        .where(eq(contactRequests.id, id));
      return NextResponse.json({ status: 'declined' });
    }

    const [a, b] = canonicalPair(request.fromUserId, request.toUserId);

    await db.transaction(async (tx) => {
      await tx
        .update(contactRequests)
        .set({ status: 'accepted' })
        .where(eq(contactRequests.id, id));

      await tx.insert(contacts).values({
        userIdA: a,
        userIdB: b,
      }).onConflictDoNothing({ target: [contacts.userIdA, contacts.userIdB] });
    });

    return NextResponse.json({ status: 'accepted' });
  } catch (e) {
    console.error('PATCH /api/me/contacts/requests/[id]', e);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
