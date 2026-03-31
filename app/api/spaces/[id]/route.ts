import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { liveSpaces } from '@/lib/db/schema';
import { getSessionForRequest } from '@/lib/session';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const SEED_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionForRequest(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const spaceId = (await params).id;
    if (!spaceId) {
      return NextResponse.json({ error: 'Missing space ID' }, { status: 400 });
    }

    const [space] = await db.select().from(liveSpaces).where(eq(liveSpaces.id, spaceId)).limit(1);
    
    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    const isCreator = space.creatorId === session.user.id;
    const isSeed = session.user.id === SEED_USER_ID;

    if (!isCreator && !isSeed) {
      return NextResponse.json({ error: 'Forbidden. Only the creator or admin can delete this room.' }, { status: 403 });
    }

    await db.delete(liveSpaces).where(eq(liveSpaces.id, spaceId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE space]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
