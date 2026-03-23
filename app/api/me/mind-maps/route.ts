import { NextResponse } from 'next/server';
import { db, mindMaps } from '@/lib/db';
import { getSessionForServerComponent } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const session = await getSessionForServerComponent();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title } = await req.json();

    const [newMap] = await db.insert(mindMaps).values({
      title: title || 'Новая карта',
      createdById: session.user.id,
      universeId: null, // Private map
    }).returning();

    return NextResponse.json(newMap);
  } catch (e) {
    console.error('POST /api/me/mind-maps', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
